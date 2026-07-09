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

  const timetableRow = {
    class_name: 'QA Class',
    subject: 'QA Subject',
    teacher_name: 'QA Teacher',
    room: 'Q101',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
  };

  const timetableInsert = await client.from('timetable_entries').insert(timetableRow).select('*');
  console.log(`${label} timetable insert error:`, timetableInsert.error?.message ?? null);
  console.log(`${label} timetable insert data:`, JSON.stringify(timetableInsert.data ?? null, 2));
  const timetableId = timetableInsert.data?.[0]?.id;
  if (timetableId) {
    const timetableUpdate = await client.from('timetable_entries').update({ room: 'Q102' }).eq('id', timetableId).select('*');
    console.log(`${label} timetable update error:`, timetableUpdate.error?.message ?? null);
    const timetableDelete = await client.from('timetable_entries').delete().eq('id', timetableId).select('*');
    console.log(`${label} timetable delete error:`, timetableDelete.error?.message ?? null);
  }

  if (!studentId) {
    console.log(`${label} no studentId available for marks test`);
    return;
  }

  const marksRow = {
    student_id: studentId,
    student_name: 'QA Student',
    subject: 'QA Subject',
    midterm: 50,
    finals: 60,
    internal: 20,
    max_score: 200,
  };

  const marksInsert = await client.from('marks').insert(marksRow).select('*');
  console.log(`${label} marks insert error:`, marksInsert.error?.message ?? null);
  console.log(`${label} marks insert data:`, JSON.stringify(marksInsert.data ?? null, 2));
  const marksId = marksInsert.data?.[0]?.id;
  if (marksId) {
    const marksUpdate = await client.from('marks').update({ finals: 65 }).eq('id', marksId).select('*');
    console.log(`${label} marks update error:`, marksUpdate.error?.message ?? null);
    const marksDelete = await client.from('marks').delete().eq('id', marksId).select('*');
    console.log(`${label} marks delete error:`, marksDelete.error?.message ?? null);
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
    name: 'QA Student For Marks',
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
