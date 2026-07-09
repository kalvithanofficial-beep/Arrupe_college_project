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

console.log('Supabase connection:');
console.log({ url, anonKeyPresent: Boolean(key) });

if (!url || !key) {
  console.error('Missing .env Supabase config');
  process.exit(2);
}

const supabase = createClient(url, key);

async function run() {
  console.log('Starting verbose QA inserts...');

  const studentPayload = {
    name: 'Test Student QA',
    roll_no: 'QA-001',
    class_name: 'X',
    section: 'B',
    parent_email: 'parent.qa@example.com'
  };

  const studentInsertResponse = await supabase.from('students').insert(studentPayload).select('*').single();
  console.log('Student insert response:', JSON.stringify(studentInsertResponse, null, 2));

  const studentId = studentInsertResponse.data?.id ?? null;

  const verifyStudentResponse = studentId
    ? await supabase.from('students').select('*').eq('id', studentId).single()
    : { data: null, error: null };
  console.log('Student verify response:', JSON.stringify(verifyStudentResponse, null, 2));

  if (!studentId) {
    console.warn('Student insert failed or returned no id. Aborting further inserts to avoid cascading failures.');
    return;
  }

  const studentUpdateResponse = await supabase.from('students').update({ name: 'Test Student QA Updated' }).eq('id', studentId).select('*').single();
  console.log('Student update response:', JSON.stringify(studentUpdateResponse, null, 2));

  const today = new Date().toISOString().slice(0, 10);
  const attendancePayload = {
    student_id: studentId,
    student_name: studentUpdateResponse.data?.name || 'Test Student QA Updated',
    class_name: 'X',
    section: 'B',
    date: today,
    present: true
  };
  const attendanceResponse = await supabase.from('attendance_records').insert(attendancePayload).select('*').single();
  console.log('Attendance insert response:', JSON.stringify(attendanceResponse, null, 2));

  const noticePayload = {
    title: 'QA Test Notice',
    content: 'This is a test notice created by QA script. @#$%^&*() Unicode ✓',
    notice_type: 'INTERNAL'
  };
  const noticeResponse = await supabase.from('notices').insert(noticePayload).select('*').single();
  console.log('Notice insert response:', JSON.stringify(noticeResponse, null, 2));

  const dayOfWeek = new Date().getDay();
  const timetablePayload = {
    class_name: 'X',
    subject: 'Mathematics QA',
    teacher_name: 'Mr QA',
    room: 'Lab 1',
    day_of_week: dayOfWeek,
    start_time: '14:00:00',
    end_time: '15:00:00'
  };
  const timetableResponse = await supabase.from('timetable_entries').insert(timetablePayload).select('*').single();
  console.log('Timetable insert response:', JSON.stringify(timetableResponse, null, 2));

  const marksPayload = {
    student_id: studentId,
    student_name: studentUpdateResponse.data?.name || 'Test Student QA Updated',
    subject: 'Mathematics QA',
    midterm: 78,
    finals: 85,
    internal: 20
  };
  const marksResponse = await supabase.from('marks').insert(marksPayload).select('*').single();
  console.log('Marks insert response:', JSON.stringify(marksResponse, null, 2));

  console.log('Verbose QA insert script complete. Note: if inserts failed, check the response errors above.');
}

run().catch(err => {
  console.error('Verbose QA script failed:', err);
  process.exit(1);
});
