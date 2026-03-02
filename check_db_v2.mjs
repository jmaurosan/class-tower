import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xddmtbuuqairndciiepn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZG10YnV1cWFpcm5kY2lpZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjM5MjksImV4cCI6MjA4NTE5OTkyOX0.lhs6qnGLOW5S8cwgQVNPu3zCrpgc89GBRaiunVi-8Gc'
);

async function check() {
  try {
    // Check avisos to see if we see anything
    const { data: avisos, error: errAvisos } = await supabase.from('avisos').select('id, titulo').limit(5);
    console.log('--- Avisos (Sample) ---');
    console.log(JSON.stringify(avisos, null, 2));

    // Try to see if there's any data in agendamentos without filters
    const { data: allAgendamentos, error: errAgend } = await supabase.from('agendamentos').select('count', { count: 'exact', head: true });
    console.log('--- Total Agendamentos (Count) ---');
    console.log(allAgendamentos, errAgend);

  } catch (e) {
    console.error('Falha:', e);
  }
}

check();
