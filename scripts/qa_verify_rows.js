import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    return Object.fromEntries(
      txt.split(/\r?\n/).filter(Boolean).map(line => {
        const [key, ...rest] = line.split('=');
        const value = rest.join('=').replace(/^"|"$/g, '');
        return [key.trim(), value.trim()];
      })
    );
  } catch (err) {
    console.error('Error loading .env', err);
    process.exit(1);
  }
}

const env = loadEnv('.env');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Verifying inserted QA rows...');
  const [studentRes, attendanceRes, marksRes, noticeRes, timetableRes] = await Promise.all([
    supabase.from('students').select('*').eq('roll_no', 'QA-001').maybeSingle(),
    supabase.from('attendance_records').select('*').ilike('student_name', 'Test Student QA%'),
    supabase.from('marks').select('*').eq('subject', 'Mathematics QA'),
    supabase.from('notices').select('*').eq('title', 'QA Test Notice').maybeSingle(),
    supabase.from('timetable_entries').select('*').ilike('subject', 'Mathematics QA%')
  ]);

  console.log('Student:', studentRes.error ? studentRes.error : studentRes.data);
  console.log('Attendance count:', attendanceRes.error ? attendanceRes.error : attendanceRes.data?.length);
  console.log('Attendance entries:', attendanceRes.error ? null : attendanceRes.data);
  console.log('Marks count:', marksRes.error ? marksRes.error : marksRes.data?.length);
  console.log('Marks entries:', marksRes.error ? null : marksRes.data);
  console.log('Notice:', noticeRes.error ? noticeRes.error : noticeRes.data);
  console.log('Timetable count:', timetableRes.error ? timetableRes.error : timetableRes.data?.length);
  console.log('Timetable entries:', timetableRes.error ? null : timetableRes.data);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
