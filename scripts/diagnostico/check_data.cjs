const { createClient } = require('@supabase/supabase-js');

// Hardcoded for testing script - DO NOT COMMIT
const url = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'; // Replace with real one if needed manually but env should have it
const key = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(url, key);

async function check() {
  console.log('--- Buscando usuário Fulano ---');
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Fulano%')
    .limit(5);

  if (error) console.error('Erro na busca:', error);
  else {
    console.log('Usuários encontrados:', JSON.stringify(users, null, 2));
    users.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Input Role: "${u.role}"`);
      console.log(`Input Sala: "${u.sala_numero}"`);
    });
  }
}

check();
