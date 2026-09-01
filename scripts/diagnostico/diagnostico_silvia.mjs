import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xddmtbuuqairndciiepn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZG10YnV1cWFpcm5kY2lpZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjM5MjksImV4cCI6MjA4NTE5OTkyOX0.lhs6qnGLOW5S8cwgQVNPu3zCrpgc89GBRaiunVi-8Gc'
);

async function diagnose() {
  console.log('--- Diagnostico teste.t@gmail.com ---');
  
  // 1. Procurar perfil por email
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'teste.t@gmail.com');
  
  console.log('Profile found:', profile);
  if (pError) console.error('Error profile:', pError);

  // 2. Procurar na tabela salas a unidade 0102
  const { data: sala, error: sError } = await supabase
    .from('salas')
    .select('*')
    .eq('numero', '0102');
  
  console.log('Unidade 0102:', sala);
  if (sError) console.error('Error sala:', sError);

  // 3. Procurar outros perfis vinculados a 0102
  const { data: profilesBySala, error: psError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, sala_numero')
    .eq('sala_numero', '0102');
  
  console.log('Perfis vinculados a 0102:', profilesBySala);
}

diagnose();
