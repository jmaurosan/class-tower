import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xddmtbuuqairndciiepn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZG10YnV1cWFpcm5kY2lpZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjM5MjksImV4cCI6MjA4NTE5OTkyOX0.lhs6qnGLOW5S8cwgQVNPu3zCrpgc89GBRaiunVi-8Gc'
);

async function listSalas() {
  console.log('--- Listando todas as salas ---');
  const { data, error } = await supabase.from('salas').select('*');
  if (error) console.error('Error:', error);
  else console.table(data);
}

listSalas();
