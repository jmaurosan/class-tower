import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, corsHeaders, json, requireStaff } from '../_shared/auth.ts'

const ROLES_PERMITIDOS = ['admin', 'atendente', 'sala']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔒 Sem esta guarda, qualquer pessoa com a anon key podia disparar push
    // para todos os administradores ou para qualquer unidade do prédio —
    // um vetor de spam e de phishing com a identidade visual do condomínio.
    // Quem envia push é a equipe: registro de encomenda e botão de pânico.
    const guard = await requireStaff(req)
    if ('error' in guard) return guard.error

    const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const onesignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!onesignalAppId || !onesignalRestKey) {
      console.error('OneSignal keys missing on Edge Function Environment')
      return json({ error: 'Configuração OneSignal ausente no servidor' }, 500)
    }

    const supabaseAdmin = adminClient()
    const { sala_id, titulo, mensagem, url, target_role } = await req.json()

    if (!titulo || !mensagem) {
      return json({ error: 'titulo e mensagem são obrigatórios' }, 400)
    }

    let userIds: string[] = []

    if (target_role) {
      // Whitelist: `target_role` ia direto para um .ilike('%' + valor + '%'),
      // então um valor vazio ou com curinga atingia a base inteira.
      if (!ROLES_PERMITIDOS.includes(target_role)) {
        return json({ error: 'target_role inválido' }, 400)
      }

      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('role', `%${target_role}%`)
        .eq('status', 'Ativo')

      if (usersError) {
        return json({ error: `Erro ao buscar usuários com role ${target_role}` }, 500)
      }

      userIds = (usersData || []).map((u: { id: string }) => u.id)

    } else if (sala_id) {
      const { data: salaData, error: salaError } = await supabaseAdmin
        .from('salas')
        .select('numero')
        .eq('id', sala_id)
        .maybeSingle()

      if (salaError || !salaData) {
        return json({ error: 'Sala não encontrada' }, 404)
      }

      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('sala_numero', salaData.numero)
        .eq('status', 'Ativo')

      if (usersError) {
        return json({ error: 'Erro ao buscar moradores da sala' }, 500)
      }

      userIds = (usersData || []).map((u: { id: string }) => u.id)

    } else {
      return json({ error: 'sala_id ou target_role é obrigatório' }, 400)
    }

    if (userIds.length === 0) {
      return json({ message: 'Nenhum usuário encontrado para o destino informado' }, 200)
    }

    const body = {
      app_id: onesignalAppId,
      target_channel: 'push',
      include_aliases: { external_id: userIds },
      headings: { en: titulo, pt: titulo },
      contents: { en: mensagem, pt: mensagem },
      url: url || 'https://classe-tower.vercel.app/',
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${onesignalRestKey}`,
      },
      body: JSON.stringify(body),
    })

    const onesignalData = await response.json()

    if (!response.ok) {
      console.error('OneSignal Error:', onesignalData)
      return json({ error: 'Falha na API da OneSignal', details: onesignalData }, 502)
    }

    return json({ success: true, targets: userIds.length, onesignal_response: onesignalData })

  } catch (error) {
    console.error('Fatal Edge Function Error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})
