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
  console.log('Starting QA inserts...');

  // 1) Insert student
  const studentPayload = {
    name: 'Test Student QA',
    roll_no: 'QA-001',
    class_name: 'X',
    section: 'B',
    parent_email: 'parent.qa@example.com'
  };
  let { data: studentData, error: studentError } = await supabase.from('students').insert(studentPayload).select('*').single();
  if (studentError) {
    console.error('Student insert error:', studentError.message || studentError);
  } else {
    console.log('Inserted student:', studentData.id);
  }

  const studentId = studentData?.id;

  // 2) Verify student exists
  const { data: studentVerify } = await supabase.from('students').select('*').eq('id', studentId).single();
  console.log('Verified student:', studentVerify?.name, studentVerify?.roll_no);

  // 3) Update student
  const { data: studentUpdated } = await supabase.from('students').update({ name: 'Test Student QA Updated' }).eq('id', studentId).select('*').single();
  console.log('Updated student name to:', studentUpdated?.name);

  // 4) Insert attendance record for today
  const today = new Date().toISOString().slice(0,10);
  const attendancePayload = {
    student_id: studentId,
    student_name: studentUpdated?.name || 'Test Student QA Updated',
    class_name: 'X',
    section: 'B',
    date: today,
    present: true
  };
  const { data: attData, error: attError } = await supabase.from('attendance_records').insert(attendancePayload).select('*').single();
  if (attError) {
    console.error('Attendance insert error:', attError.message || attError);
  } else {
    console.log('Inserted attendance id:', attData.id);
  }

  // Verify attendance
  const { data: attVerify } = await supabase.from('attendance_records').select('*').eq('student_id', studentId).eq('date', today).single();
  console.log('Verified attendance present:', attVerify?.present);

  // Update attendance
  await supabase.from('attendance_records').update({ present: false }).eq('id', attVerify.id);
  const { data: attAfterUpdate } = await supabase.from('attendance_records').select('*').eq('id', attVerify.id).single();
  console.log('Attendance after update present:', attAfterUpdate.present);

  // 5) Insert notice
  const noticePayload = {
    title: 'QA Test Notice',
    content: 'This is a test notice created by QA script. @#$%^&*() Unicode ✓',
    notice_type: 'INTERNAL'
  };
  const { data: noticeData, error: noticeError } = await supabase.from('notices').insert(noticePayload).select('*').single();
  if (noticeError) console.error('Notice insert error:', noticeError.message || noticeError);
  else console.log('Inserted notice id:', noticeData.id);

  // Verify notice
  const { data: noticeVerify } = await supabase.from('notices').select('*').eq('id', noticeData.id).single();
  console.log('Verified notice title:', noticeVerify.title);

  // 6) Insert timetable entry for today's day_of_week
  const dayOfWeek = new Date().getDay(); // 0 (Sun) - 6 (Sat)
  const timetablePayload = {
    class_name: 'X',
    subject: 'Mathematics QA',
    teacher_name: 'Mr QA',
    room: 'Lab 1',
    day_of_week: dayOfWeek,
    start_time: '14:00:00',
    end_time: '15:00:00'
  };
  const { data: ttData, error: ttError } = await supabase.from('timetable_entries').insert(timetablePayload).select('*').single();
  if (ttError) console.error('Timetable insert error:', ttError.message || ttError);
  else console.log('Inserted timetable id:', ttData.id);

  // Verify timetable
  const { data: ttVerify } = await supabase.from('timetable_entries').select('*').eq('id', ttData.id).single();
  console.log('Verified timetable subject:', ttVerify.subject, 'day:', ttVerify.day_of_week);

  // 7) Marks insertion
  const marksPayload = {
    student_id: studentId,
    student_name: studentUpdated?.name || 'Test Student QA Updated',
    subject: 'Mathematics QA',
    midterm: 78,
    finals: 85,
    internal: 20
  };
  const { data: marksData, error: marksError } = await supabase.from('marks').insert(marksPayload).select('*').single();
  if (marksError) console.error('Marks insert error:', marksError.message || marksError);
  else console.log('Inserted marks id:', marksData.id);

  // Verify marks
  const { data: marksVerify } = await supabase.from('marks').select('*').eq('id', marksData.id).single();
  console.log('Verified marks finals:', marksVerify.finals);

  // Summary
  console.log('QA inserts complete. Keep these IDs for cleanup if needed.');
  console.log({ studentId, attendanceId: attVerify?.id, noticeId: noticeData?.id, timetableId: ttData?.id, marksId: marksData?.id });
}

run().catch(err => { console.error('QA script failed', err); process.exit(1); });
