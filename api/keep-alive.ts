import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Verificar se é uma chamada do cron job da Vercel
  const authHeader = req.headers.authorization;

  // Vercel Cron Jobs incluem um header de autorização específico
  if (req.headers['user-agent']?.includes('vercel-cron') || authHeader) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
      }

      // Fazer queries simples para manter o banco ativo
      const operations = [];

      // 1. Query na tabela profiles
      const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      operations.push({ table: 'profiles', status: profilesResponse.ok ? 'ok' : 'error' });

      // 2. Query na tabela avisos
      const avisosResponse = await fetch(`${supabaseUrl}/rest/v1/avisos?select=id&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      operations.push({ table: 'avisos', status: avisosResponse.ok ? 'ok' : 'error' });

      // 3. Query na tabela encomendas
      const encomendasResponse = await fetch(`${supabaseUrl}/rest/v1/encomendas?select=id&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      operations.push({ table: 'encomendas', status: encomendasResponse.ok ? 'ok' : 'error' });

      console.log('Keep-alive executed:', {
        timestamp: new Date().toISOString(),
        operations
      });

      return res.status(200).json({
        success: true,
        message: 'Keep-alive executed successfully',
        timestamp: new Date().toISOString(),
        operations
      });

    } catch (error: any) {
      console.error('Keep-alive error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - This endpoint is only accessible by Vercel Cron Jobs'
    });
  }
}
