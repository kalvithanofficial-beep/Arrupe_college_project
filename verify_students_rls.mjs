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

async function createTestUser(email, password, role) {
  const { data, error } = await anon.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  });
  return { data, error };
}

async function runForUser(label, email, password) {
  console.log(`\n--- ${label} ---`);
  const { data: signInData, error: signInError } = await signIn(email, password);
  console.log(`${label} sign-in error:`, signInError?.message ?? null);
  if (signInError || !signInData?.session) return;

  const client = createClient(url, key, { auth: { persistSession: false } });
  await client.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });

  const row = {
    name: `${label} QA Student`,
    roll_no: `QA-${Date.now()}`,
    class_name: 'QA Class',
    section: 'A',
    parent_email: `qa.parent.${Date.now()}@arrupecollege.edu`,
  };

  const insert = await client.from('students').insert(row).select('*');
  console.log(`${label} insert error:`, insert.error?.message ?? null);
  console.log(`${label} insert data:`, JSON.stringify(insert.data ?? null, 2));
  const id = insert.data?.[0]?.id;
  if (!id) {
    console.log(`${label} insert failed; skipping update/delete`);
    return;
  }

  const update = await client.from('students').update({ class_name: 'QA Class Updated' }).eq('id', id).select('*');
  console.log(`${label} update error:`, update.error?.message ?? null);
  console.log(`${label} update data:`, JSON.stringify(update.data ?? null, 2));

  const del = await client.from('students').delete().eq('id', id).select('*');
  console.log(`${label} delete error:`, del.error?.message ?? null);
  console.log(`${label} delete data:`, JSON.stringify(del.data ?? null, 2));
}

async function main() {
  await runForUser('Admin', 'admin@arrupecollege.edu', 'Admin@arrupecollege.edu123');

  const studentEmail = `qa.student.${Date.now()}@arrupecollege.edu`;
  const parentEmail = `qa.parent.${Date.now()}@arrupecollege.edu`;
  const teacherEmail = `qa.teacher.${Date.now()}@arrupecollege.edu`;
  const password = 'Test@1234';

  const student = await createTestUser(studentEmail, password, 'student');
  console.log('\nStudent signup error:', student.error?.message ?? null);
  const parent = await createTestUser(parentEmail, password, 'parent');
  console.log('Parent signup error:', parent.error?.message ?? null);
  const teacher = await createTestUser(teacherEmail, password, 'teacher');
  console.log('Teacher signup error:', teacher.error?.message ?? null);

  await runForUser('Student', studentEmail, password);
  await runForUser('Parent', parentEmail, password);
  await runForUser('Teacher', teacherEmail, password);
}

main().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
