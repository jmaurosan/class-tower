import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, corsHeaders, json } from '../_shared/auth.ts'

/**
 * Worker da fila de notificações.
 *
 * Chamado a cada minuto pelo pg_cron. Reserva um lote, entrega, registra o
 * resultado. A entrega deixa de depender do navegador do porteiro estar
 * aberto no momento certo.
 *
 * O canal aqui é o OneSignal. Para trocar por WhatsApp, só a função
 * `entregar()` muda — a fila, o trigger e o agendamento continuam iguais.
 */

const LOTE = 25

interface Notificacao {
  id: string
  destino_sala_numero: string | null
  destino_role: string | null
  titulo: string
  mensagem: string
  url: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Só o cron chama esta função. O gateway já exige um JWT válido, mas isso
    // inclui a anon key — então conferimos que o token é mesmo o service_role.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()

    if (!ehServiceRole(token)) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const appId = Deno.env.get('ONESIGNAL_APP_ID')
    const restKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    // Sem as chaves não adianta reservar nada: consumiríamos as tentativas de
    // cada notificação até todas irem para 'falha'. Melhor deixá-las na fila
    // até que as chaves sejam configuradas.
    if (!appId || !restKey) {
      console.error('OneSignal keys ausentes; fila preservada.')
      return json({ error: 'Configuração OneSignal ausente no servidor' }, 500)
    }

    const db = adminClient()

    const { data: lote, error: erroLote } = await db.rpc('reservar_notificacoes', { limite: LOTE })
    if (erroLote) {
      console.error('Falha ao reservar lote:', erroLote)
      return json({ error: erroLote.message }, 500)
    }

    const pendentes = (lote ?? []) as Notificacao[]
    if (pendentes.length === 0) {
      return json({ processadas: 0 })
    }

    let enviadas = 0
    let falhas = 0

    for (const n of pendentes) {
      try {
        const destinatarios = await resolverDestinatarios(db, n)

        if (destinatarios.length === 0) {
          // Ninguém para notificar não é erro: a unidade pode ainda não ter
          // morador cadastrado. Encerra como enviada para não repetir.
          await db.rpc('concluir_notificacao', {
            p_id: n.id, p_sucesso: true, p_erro: null, p_destinatarios: 0,
          })
          enviadas++
          continue
        }

        await enviarPush(appId, restKey, destinatarios, n)

        await db.rpc('concluir_notificacao', {
          p_id: n.id, p_sucesso: true, p_erro: null, p_destinatarios: destinatarios.length,
        })
        enviadas++

      } catch (err) {
        const msg = (err as Error).message?.slice(0, 500) ?? 'erro desconhecido'
        console.error(`Notificação ${n.id} falhou:`, msg)

        await db.rpc('concluir_notificacao', {
          p_id: n.id, p_sucesso: false, p_erro: msg, p_destinatarios: null,
        })
        falhas++
      }
    }

    return json({ processadas: pendentes.length, enviadas, falhas })

  } catch (error) {
    console.error('processar-notificacoes error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})

/**
 * A comparação direta com SUPABASE_SERVICE_ROLE_KEY falhava: o valor que a
 * função recebe no ambiente nem sempre é byte a byte o mesmo que está no
 * painel (o Supabase vem migrando o formato das chaves de API).
 *
 * Ler a claim `role` é confiável porque a assinatura do token já foi
 * verificada pelo gateway — a função está publicada com verify_jwt = true,
 * então nada com assinatura inválida chega até aqui.
 */
function ehServiceRole(token: string | undefined): boolean {
  if (!token) return false

  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (key && token === key) return true

  try {
    const payload = token.split('.')[1]
    if (!payload) return false
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)?.role === 'service_role'
  } catch {
    return false
  }
}

async function resolverDestinatarios(
  db: ReturnType<typeof adminClient>,
  n: Notificacao,
): Promise<string[]> {
  let q = db.from('profiles').select('id').eq('status', 'Ativo')

  if (n.destino_sala_numero) {
    q = q.eq('sala_numero', n.destino_sala_numero)
  } else if (n.destino_role) {
    q = q.ilike('role', `%${n.destino_role}%`)
  } else {
    throw new Error('Notificação sem destino definido')
  }

  const { data, error } = await q
  if (error) throw new Error(`Falha ao resolver destinatários: ${error.message}`)

  return (data ?? []).map((u: { id: string }) => u.id)
}

async function enviarPush(
  appId: string,
  restKey: string,
  userIds: string[],
  n: Notificacao,
): Promise<void> {
  const corpo = JSON.stringify({
    app_id: appId,
    target_channel: 'push',
    include_aliases: { external_id: userIds },
    headings: { en: n.titulo, pt: n.titulo },
    contents: { en: n.mensagem, pt: n.mensagem },
    url: n.url ? `https://classe-tower.vercel.app${n.url}` : 'https://classe-tower.vercel.app/',
  })

  // O OneSignal mudou o esquema de autorização: as chaves antigas usam
  // `Basic`, as novas usam `Key`. Como o formato depende de quando o app foi
  // criado, tentamos um e caímos no outro se vier 401.
  let ultimoErro = ''

  for (const esquema of ['Basic', 'Key']) {
    const resposta = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${esquema} ${restKey}`,
      },
      body: corpo,
    })

    const retorno = await resposta.json().catch(() => ({}))

    if (resposta.ok) return

    ultimoErro = `OneSignal ${resposta.status} (${esquema}): ${JSON.stringify(retorno).slice(0, 250)}`

    // Só vale tentar o outro esquema em erro de autenticação.
    if (resposta.status !== 401 && resposta.status !== 403) break
  }

  throw new Error(ultimoErro)
}
