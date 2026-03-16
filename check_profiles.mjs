import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xddmtbuuqairndciiepn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZG10YnV1cWFpcm5kY2lpZXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjM5MjksImV4cCI6MjA4NTE5OTkyOX0.lhs6qnGLOW5S8cwgQVNPu3zCrpgc89GBRaiunVi-8Gc'
);

async function check() {
  console.log('--- Checking all profiles ---');
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log('Error:', error);
  console.log('Profiles in DB:', JSON.stringify(profiles, null, 2));
}

check();
