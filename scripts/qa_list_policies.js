import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const lines = txt.split(/\r?\n/);
    const out = {};
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) {
        let v = m[2];
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        out[m[1]] = v;
      }
    }
    return out;
  } catch (err) {
    return {};
  }
}

const env = loadEnv('.env');
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing .env Supabase config');
  process.exit(2);
}
const supabase = createClient(url, key);

async function run() {
  console.log('Checking row level security policy visibility for current client...');
  const tables = ['students', 'attendance_records', 'notices', 'marks', 'timetable_entries'];
  for (const table of tables) {
    const response = await supabase.rpc('pg_get_table_policy', { table_name: table }).select('*');
    console.log('POLICIES for', table, JSON.stringify(response, null, 2));
  }
}

run().catch(err => { console.error('Policy introspection failed', err); process.exit(1); });
