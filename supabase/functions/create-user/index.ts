import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, corsHeaders, json, requireAdmin } from '../_shared/auth.ts'

const ROLES_VALIDOS = ['admin', 'atendente', 'sala']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔒 Só um admin autenticado cria usuários. Antes, a única proteção era um
    // FUNCTION_SECRET opcional que o frontend nunca enviava — na prática,
    // qualquer um com a anon key podia criar uma conta de administrador.
    const guard = await requireAdmin(req)
    if ('error' in guard) return guard.error

    const supabaseAdmin = adminClient()
    const { email, password, name, role, sala_numero, permissions } = await req.json()

    if (!email || !password || !name) {
      return json({ error: 'email, password e name são obrigatórios' }, 400)
    }

    if (role && !ROLES_VALIDOS.includes(role)) {
      return json({ error: `role inválido. Use um de: ${ROLES_VALIDOS.join(', ')}` }, 400)
    }

    const roleFinal = role ?? 'sala'
    const salaFinal = roleFinal === 'sala' ? String(sala_numero ?? '') : '0000'

    if (roleFinal === 'sala' && !salaFinal) {
      return json({ error: 'sala_numero é obrigatório para o perfil de sala' }, 400)
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: roleFinal === 'sala' ? `${name} (Sala ${salaFinal})` : name,
        full_name: name,
        sala_numero: salaFinal,
      },
    })

    if (createError) {
      return json({ error: createError.message }, 400)
    }

    if (!newUser?.user?.id) {
      return json({ error: 'Usuário não foi criado' }, 500)
    }

    // O trigger cria o perfil sempre como 'sala'. Aqui, com service_role e já
    // tendo confirmado que o chamador é admin, aplicamos o role real.
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      full_name: name,
      email,
      role: roleFinal,
      sala_numero: salaFinal,
      permissions: permissions ?? {},
      status: 'Ativo',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (profileError) {
      // Não deixa um usuário órfão no Auth sem perfil correspondente.
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return json({ error: `Falha ao gravar perfil: ${profileError.message}` }, 500)
    }

    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'profiles',
      record_id: newUser.user.id,
      action: 'INSERT',
      executed_by: guard.caller.id,
      executed_by_name: guard.caller.email,
      new_data: { email, name, role: roleFinal, sala_numero: salaFinal },
    })

    const agora = new Date()
    const { error: avisoError } = await supabaseAdmin.from('avisos').insert([{
      titulo: 'Bem-vindo ao Class Tower!',
      conteudo: `Olá ${name}! Sua conta foi criada com sucesso no sistema Class Tower. Aqui você pode acompanhar encomendas, agendamentos, avisos e muito mais. Qualquer dúvida, acesse o Suporte Técnico no menu lateral.`,
      prioridade: 'Baixa',
      data: agora.toISOString().split('T')[0],
      hora: agora.toTimeString().split(' ')[0].substring(0, 5),
      // avisos.criado_por é uuid e referencia auth.users. A string 'Sistema'
      // que estava aqui fazia o insert falhar silenciosamente, então o aviso
      // de boas-vindas nunca era criado.
      criado_por: guard.caller.id,
      sala_numero: roleFinal === 'sala' ? salaFinal : null,
      status: 'Ativo',
    }])

    if (avisoError) {
      console.warn('Aviso de boas-vindas não foi criado:', avisoError.message)
    }

    return json({ success: true, userId: newUser.user.id })

  } catch (error) {
    console.error('create-user error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})
