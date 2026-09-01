import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, corsHeaders, json, requireAdmin } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔒 Só um admin autenticado exclui usuários. Antes, qualquer chamada com
    // a anon key podia apagar qualquer conta informando o id.
    const guard = await requireAdmin(req)
    if ('error' in guard) return guard.error

    const { userId } = await req.json()

    if (!userId) {
      return json({ error: 'userId é obrigatório' }, 400)
    }

    if (userId === guard.caller.id) {
      return json({ error: 'Você não pode excluir a própria conta' }, 400)
    }

    const supabaseAdmin = adminClient()

    // Impede que o último admin do sistema seja removido, o que deixaria o
    // condomínio sem ninguém capaz de gerenciar usuários.
    const { data: alvo } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (alvo && String(alvo.role ?? '').toLowerCase().includes('admin')) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .ilike('role', '%admin%')

      if ((count ?? 0) <= 1) {
        return json({ error: 'Não é possível excluir o último administrador' }, 400)
      }
    }

    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return json({ error: deleteError.message }, 400)
    }

    return json({ success: true })

  } catch (error) {
    console.error('delete-user error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})
