import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Valida secret de servidor (proteção simples e confiável)
    // Se FUNCTION_SECRET estiver configurado nos Secrets da Edge Function, exige verificação
    const functionSecret = Deno.env.get('FUNCTION_SECRET')
    const receivedSecret = req.headers.get('x-function-secret')

    if (functionSecret && receivedSecret !== functionSecret) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { email, password, name, role, sala_numero, permissions } = await req.json()

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'email, password e name são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cria usuário via Admin API - bypassa validação de domínio e confirmação de e-mail
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        name: role === 'sala' ? `${name} (Sala ${sala_numero})` : name,
        full_name: name, 
        role, 
        sala_numero, 
        permissions 
      }
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upsert perfil como garantia (caso o trigger não dispare)
    if (newUser?.user?.id) {
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        full_name: name,
        email,
        role,
        sala_numero: role === 'sala' ? sala_numero : '0000',
        permissions: permissions || {},
        status: 'Ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUser?.user?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('create-user error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
