import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => {
        const [key, ...rest] = line.split('=');
        return [key.trim(), rest.join('=').trim().replace(/^"|"$/g, '')];
      })
  );
}

const env = loadEnv('.env');
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Missing Supabase env values');
const anon = createClient(url, key, { auth: { persistSession: false } });

async function signIn(email, password) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function runCycle(label, email, password) {
  console.log(`\n--- ${label} cycle ---`);
  const { data, error } = await signIn(email, password);
  console.log(`${label} sign-in error:`, error?.message ?? null);
  if (error || !data?.session) {
    console.log(`${label} sign-in failed; skipping cycle.`);
    return;
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  await client.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });

  const { data: students, error: studentError } = await client.from('students').select('id,name,roll_no').limit(1);
  if (studentError) {
    console.log(`${label} failed to fetch student:`, studentError.message);
  }
  const student = Array.isArray(students) && students[0];
  const student_id = student?.id ?? null;
  console.log(`${label} using student_id:`, student_id);

  const row = {
    student_id,
    student_name: student?.name ?? `QA Student ${Date.now()}`,
    class_name: student?.class_name ?? 'Test Class',
    section: student?.section ?? 'A',
    date: new Date().toISOString().slice(0, 10),
    present: false,
  };

  const insert = await client.from('attendance_records').insert(row).select('*');
  console.log(`${label} insert error:`, insert.error?.message ?? null);
  console.log(`${label} insert data:`, JSON.stringify(insert.data ?? null, null, 2));
  const id = insert.data?.[0]?.id;
  if (!id) {
    console.log(`${label} insert failed; stopping cycle.`);
    return;
  }

  const update = await client.from('attendance_records').update({ present: true }).eq('id', id).select('*');
  console.log(`${label} update error:`, update.error?.message ?? null);
  console.log(`${label} update data:`, JSON.stringify(update.data ?? null, null, 2));

  const del = await client.from('attendance_records').delete().eq('id', id).select('*');
  console.log(`${label} delete error:`, del.error?.message ?? null);
  console.log(`${label} delete data:`, JSON.stringify(del.data ?? null, null, 2));
}

async function main() {
  await runCycle('Admin', 'admin@arrupecollege.edu', 'Admin@arrupecollege.edu123');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
