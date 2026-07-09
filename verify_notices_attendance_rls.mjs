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

async function runForUser(label, email, password, studentId) {
  console.log(`\n--- ${label} ---`);
  const { data: signInData, error: signInError } = await signIn(email, password);
  console.log(`${label} sign-in error:`, signInError?.message ?? null);
  if (signInError || !signInData?.session) return;
  const client = createClient(url, key, { auth: { persistSession: false } });
  await client.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });

  const noticeRow = {
    title: `QA Notice ${Date.now()}`,
    content: 'QA notice content',
    notice_type: 'UPDATE',
  };
  const noticeInsert = await client.from('notices').insert(noticeRow).select('*');
  console.log(`${label} notice insert error:`, noticeInsert.error?.message ?? null);
  console.log(`${label} notice insert data:`, JSON.stringify(noticeInsert.data ?? null, 2));
  const noticeId = noticeInsert.data?.[0]?.id;
  if (noticeId) {
    const noticeUpdate = await client.from('notices').update({ content: 'QA notice updated' }).eq('id', noticeId).select('*');
    console.log(`${label} notice update error:`, noticeUpdate.error?.message ?? null);
    const noticeDelete = await client.from('notices').delete().eq('id', noticeId).select('*');
    console.log(`${label} notice delete error:`, noticeDelete.error?.message ?? null);
  }

  const attendanceRow = {
    student_id: studentId,
    student_name: 'QA Student',
    class_name: 'QA Class',
    section: 'A',
    present: true,
  };
  const attendanceInsert = await client.from('attendance_records').insert(attendanceRow).select('*');
  console.log(`${label} attendance insert error:`, attendanceInsert.error?.message ?? null);
  console.log(`${label} attendance insert data:`, JSON.stringify(attendanceInsert.data ?? null, 2));
  const attendanceId = attendanceInsert.data?.[0]?.id;
  if (attendanceId) {
    const attendanceUpdate = await client.from('attendance_records').update({ present: false }).eq('id', attendanceId).select('*');
    console.log(`${label} attendance update error:`, attendanceUpdate.error?.message ?? null);
    const attendanceDelete = await client.from('attendance_records').delete().eq('id', attendanceId).select('*');
    console.log(`${label} attendance delete error:`, attendanceDelete.error?.message ?? null);
  }
}

async function main() {
  const adminEmail = 'admin@arrupecollege.edu';
  const adminPassword = 'Admin@arrupecollege.edu123';

  const adminSignIn = await signIn(adminEmail, adminPassword);
  if (adminSignIn.error || !adminSignIn.data?.session) {
    console.error('Admin sign-in failed:', adminSignIn.error?.message ?? adminSignIn);
    return;
  }

  const adminClient = createClient(url, key, { auth: { persistSession: false } });
  await adminClient.auth.setSession({ access_token: adminSignIn.data.session.access_token, refresh_token: adminSignIn.data.session.refresh_token });
  const studentRow = {
    name: 'QA Student For Attendance',
    roll_no: `QA-${Date.now()}`,
    class_name: 'QA Class',
    section: 'A',
    parent_email: `qa.parent.${Date.now()}@arrupecollege.edu`,
  };
  const studentInsert = await adminClient.from('students').insert(studentRow).select('id');
  const studentId = studentInsert.data?.[0]?.id;
  console.log('Admin created test student id:', studentId, 'error:', studentInsert.error?.message ?? null);

  await runForUser('Admin', adminEmail, adminPassword, studentId);

  const studentEmail = `qa.student.${Date.now()}@arrupecollege.edu`;
  const parentEmail = `qa.parent.${Date.now()}@arrupecollege.edu`;
  const teacherEmail = `qa.teacher.${Date.now()}@arrupecollege.edu`;
  const password = 'Test@1234';

  const student = await createTestUser(studentEmail, password, 'student');
  const parent = await createTestUser(parentEmail, password, 'parent');
  const teacher = await createTestUser(teacherEmail, password, 'teacher');

  console.log('Student signup error:', student.error?.message ?? null);
  console.log('Parent signup error:', parent.error?.message ?? null);
  console.log('Teacher signup error:', teacher.error?.message ?? null);

  await runForUser('Student', studentEmail, password, studentId);
  await runForUser('Parent', parentEmail, password, studentId);
  await runForUser('Teacher', teacherEmail, password, studentId);
}

main().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
