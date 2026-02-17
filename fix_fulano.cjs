const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  if (!urlMatch || !keyMatch) {
    console.log('ERRO: Credenciais não encontradas no .env');
    process.exit(1);
  }

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  async function run() {
    console.log('--- Buscando usuário Fulano ---');
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', '%Fulano%');

    if (error) {
      console.error('Erro na busca:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('Nenhum usuário encontrado com nome Fulano');
      return;
    }

    const user = users[0];
    console.log(`Usuário encontrado: ${user.full_name} (${user.id})`);
    console.log(`Role atual: "${user.role}"`);
    console.log(`Sala atual: "${user.sala_numero}"`);

    // Correção automática se necessário
    let updates = {};

    // Se sala_numero for o texto errado, corrigir para 0101 (conforme solicitado pelo usuário)
    if (user.sala_numero && user.sala_numero.toUpperCase().includes('MORADOR')) {
      console.log('DETECTADO DADO CORROMPIDO EM SALA_NUMERO!');
      updates.sala_numero = '0101';
    }

    // Se role estiver errado, corrigir
    if (user.role && user.role.toUpperCase().includes('MORADOR')) {
      console.log('DETECTADO ROLE ANTIGA!');
      updates.role = 'sala'; // Normalizar para 'sala'
    }

    if (Object.keys(updates).length > 0) {
      console.log('Aplicando correções...', updates);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) console.error('Erro ao atualizar:', updateError);
      else console.log('✅ USUÁRIO CORRIGIDO COM SUCESSO!');
    } else {
      console.log('Nenhuma correção automática necessária nos dados.');
      // Se os dados estão certos, então forçar sala 0101 apenas se estiver null?
      if (!user.sala_numero) {
        console.log('Sala número vazia. Definindo 0101 por segurança.');
        await supabase.from('profiles').update({ sala_numero: '0101' }).eq('id', user.id);
      }
    }
  }

  run();

} catch (e) {
  console.error('Erro fatal:', e);
}
