import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // OneSignal Keys
    const onesignalAppId = Deno.env.get('ONESIGNAL_APP_ID')!
    const onesignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY')!

    if (!onesignalAppId || !onesignalRestKey) {
      console.error('OneSignal keys missing on Edge Function Environment')
      return new Response(JSON.stringify({ error: 'Configuração OneSignal ausente no servidor' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { sala_id, titulo, mensagem, url } = await req.json()

    if (!sala_id || !titulo || !mensagem) {
      return new Response(JSON.stringify({ error: 'sala_id, titulo e mensagem são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Fetch Room Number (sala_numero) from `salas` table using sala_id
    const { data: salaData, error: salaError } = await supabaseAdmin
      .from('salas')
      .select('numero')
      .eq('id', sala_id)
      .single()

    if (salaError || !salaData) {
      return new Response(JSON.stringify({ error: 'Sala não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const sala_numero = salaData.numero;

    // 2. Find all profiles belonging to this room
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('sala_numero', sala_numero)

    if (usersError) {
      return new Response(JSON.stringify({ error: 'Erro ao buscar moradores da sala' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userIds = usersData.map((u: any) => u.id)

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum usuário vinculado a esta sala' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Send Push via OneSignal REST API using external_id
    const body = {
      app_id: onesignalAppId,
      target_channel: "push",
      include_aliases: {
        external_id: userIds
      },
      headings: { en: titulo, pt: titulo },
      contents: { en: mensagem, pt: mensagem },
      url: url || "https://classe-tower.vercel.app/" // Default Link
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${onesignalRestKey}`
      },
      body: JSON.stringify(body)
    });

    const onesignalData = await response.json()

    if (!response.ok) {
      console.error('OneSignal Error:', onesignalData)
      return new Response(JSON.stringify({ error: 'Falha na API da OneSignal', details: onesignalData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, targets: userIds.length, onesignal_response: onesignalData }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Fatal Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
