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

async function main() {
  const teacherEmail = `qa.teacher.${Date.now()}@arrupecollege.edu`;
  const teacherPassword = 'Test@1234';
  console.log('Creating teacher account:', teacherEmail);
  const { data: signupData, error: signupError } = await anon.auth.signUp({ email: teacherEmail, password: teacherPassword, options: { data: { role: 'teacher' } } });
  console.log('Teacher signup error:', signupError?.message ?? null);
  console.log('Teacher signup user id:', signupData?.user?.id ?? null);
  if (signupError || !signupData?.user) return;

  const { data: signInData, error: signInError } = await signIn(teacherEmail, teacherPassword);
  console.log('Teacher sign-in error:', signInError?.message ?? null);
  if (signInError || !signInData?.session) return;

  const client = createClient(url, key, { auth: { persistSession: false } });
  await client.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });

  const { data: students, error: studentsError } = await client.from('students').select('id,name,class_name,section').limit(1);
  console.log('Fetch student error:', studentsError?.message ?? null);
  const student = Array.isArray(students) && students[0];
  const student_id = student?.id ?? null;
  console.log('Using student id:', student_id);

  const row = {
    student_id,
    student_name: student?.name ?? `QA Student ${Date.now()}`,
    class_name: student?.class_name ?? 'Test Class',
    section: student?.section ?? 'A',
    date: new Date().toISOString().slice(0, 10),
    present: false,
  };

  const insert = await client.from('attendance_records').insert(row).select('*');
  console.log('Teacher insert error:', insert.error?.message ?? null);
  console.log('Teacher insert data:', JSON.stringify(insert.data ?? null, null, 2));
  const id = insert.data?.[0]?.id;
  if (!id) {
    console.log('Teacher insert failed; stopping');
    return;
  }

  const update = await client.from('attendance_records').update({ present: true }).eq('id', id).select('*');
  console.log('Teacher update error:', update.error?.message ?? null);
  console.log('Teacher update data:', JSON.stringify(update.data ?? null, null, 2));

  const del = await client.from('attendance_records').delete().eq('id', id).select('*');
  console.log('Teacher delete error:', del.error?.message ?? null);
  console.log('Teacher delete data:', JSON.stringify(del.data ?? null, null, 2));
}

main().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
