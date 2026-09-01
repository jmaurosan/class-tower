import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = 'https://xddmtbuuqairndciiepn.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZG10YnV1cWFpcm5kY2lpZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjM5MjksImV4cCI6MjA4NTE5OTkyOX0.lhs6qnGLOW5S8cwgQVNPu3zCrpgc89GBRaiunVi-8Gc';

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function runDiagnostic() {
  const tables = [
    'profiles',
    'salas',
    'agendamentos',
    'encomendas',
    'audit_logs',
    'empresas',
    'vistorias'
  ];

  const results = {};

  console.log('--- INICIANDO DIAGNÓSTICO COMPLETO DO BANCO DE DADOS ---');

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      results[table] = { status: 'ERRO', detail: error.message };
    } else {
      results[table] = { status: 'OK', count };
    }
  }

  // Check RPC size if possible
  const { data: dbSize, error: sizeError } = await supabase.rpc('get_database_size');
  results['database_size'] = sizeError ? { status: 'ERRO/Pendente', detail: 'Script RPC não encontrado' } : { status: 'OK', value: dbSize };

  console.log(JSON.stringify(results, null, 2));
}

runDiagnostic();
