import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    txt.split(/\r?\n/)
      .filter(Boolean)
      .map(line => {
        const [key, ...rest] = line.split('=');
        const value = rest.join('=').replace(/^"|"$/g, '');
        return [key.trim(), value.trim()];
      })
  );
}

const env = loadEnv('.env');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Verifying QA minimal insert row...');
  const { data, error } = await supabase.from('students').select('*').eq('roll_no', 'QA-001').maybeSingle();
  console.log('Verification response:', JSON.stringify({ data, error }, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
