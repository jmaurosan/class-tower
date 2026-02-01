import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Realizar operações simples para manter o banco ativo
    const operations = []

    // 1. Verificar tabelas principais
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    operations.push({
      table: 'profiles',
      status: profilesError ? 'error' : 'ok',
      count: profiles?.length || 0
    })

    // 2. Verificar tabela de avisos
    const { data: avisos, error: avisosError } = await supabase
      .from('avisos')
      .select('id')
      .limit(1)

    operations.push({
      table: 'avisos',
      status: avisosError ? 'error' : 'ok',
      count: avisos?.length || 0
    })

    // 3. Verificar tabela de encomendas
    const { data: encomendas, error: encomendasError } = await supabase
      .from('encomendas')
      .select('id')
      .limit(1)

    operations.push({
      table: 'encomendas',
      status: encomendasError ? 'error' : 'ok',
      count: encomendas?.length || 0
    })

    // 4. Registrar log de keep-alive (opcional - criar tabela se necessário)
    const keepAliveLog = {
      executed_at: new Date().toISOString(),
      operations: operations,
      status: 'success'
    }

    console.log('Keep-alive executed:', keepAliveLog)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Keep-alive executed successfully',
        timestamp: new Date().toISOString(),
        operations: operations
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Keep-alive error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
