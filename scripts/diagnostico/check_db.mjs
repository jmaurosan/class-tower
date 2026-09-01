import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xddmtbuuqairndciiepn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZG10YnV1cWFpcm5kY2lpZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjM5MjksImV4cCI6MjA4NTE5OTkyOX0.lhs6qnGLOW5S8cwgQVNPu3zCrpgc89GBRaiunVi-8Gc'
);

async function check() {
  try {
    const { data: agendamentos, error: err1 } = await supabase.from('agendamentos').select('id, titulo, data, hora, status');
    const { data: logs, error: err2 } = await supabase.from('audit_logs').select('*').eq('action', 'DELETE').order('created_at', { ascending: false }).limit(5);

    if (err1) console.error('Erro agendamentos:', err1);
    if (err2) console.error('Erro logs:', err2);

    console.log('--- Agendamentos Atuais ---');
    console.log(JSON.stringify(agendamentos, null, 2));
    console.log('--- Últimos Logs de Exclusão ---');
    console.log(JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Falha catastrófica:', e);
  }
}

check();
