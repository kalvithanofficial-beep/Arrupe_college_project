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
  console.log('Starting minimal insert test...');
  const studentPayload = {
    name: 'Test Student QA',
    roll_no: 'QA-001',
    class_name: 'X',
    section: 'B',
    parent_email: 'parent.qa@example.com'
  };

  const response = await supabase
    .from('students')
    .insert(studentPayload, { returning: 'minimal' });

  console.log('Minimal student insert response:', JSON.stringify(response, null, 2));
}

run().catch(err => {
  console.error('Minimal insert failed:', err);
  process.exit(1);
});
