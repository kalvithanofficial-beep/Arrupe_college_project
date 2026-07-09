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
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(2);
}

const supabase = createClient(url, key);

async function check() {
  try {
    const { data, error } = await supabase.from('profiles').select('id,email,role').limit(1);
    if (error) {
      console.error('Supabase query error:', error.message || error);
      process.exit(3);
    }
    console.log('Supabase reachable. Sample profile:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(4);
  }
}

check();
