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

async function verify() {
  console.log('Verifying QA rows by known markers...');

  const { data: student, error: sErr } = await supabase.from('students').select('*').eq('roll_no', 'QA-001').maybeSingle();
  if (sErr) console.error('Student query error:', sErr);
  console.log('Student row:', student);

  const { data: attendance, error: aErr } = await supabase.from('attendance_records').select('*').ilike('student_name', 'Test Student QA%');
  if (aErr) console.error('Attendance query error:', aErr);
  console.log('Attendance rows (count):', attendance?.length);
  console.log(attendance);

  const { data: marks, error: mErr } = await supabase.from('marks').select('*').eq('subject', 'Mathematics QA');
  if (mErr) console.error('Marks query error:', mErr);
  console.log('Marks rows (count):', marks?.length);
  console.log(marks);

  const { data: notices, error: nErr } = await supabase.from('notices').select('*').eq('title', 'QA Test Notice').maybeSingle();
  if (nErr) console.error('Notices query error:', nErr);
  console.log('Notice row:', notices);

  const { data: tt, error: tErr } = await supabase.from('timetable_entries').select('*').ilike('subject', 'Mathematics QA%');
  if (tErr) console.error('Timetable query error:', tErr);
  console.log('Timetable rows (count):', tt?.length);
  console.log(tt);

  console.log('Verification complete. Do you want me to delete these test rows now? Reply CONFIRM DELETE to proceed with cleanup (and then revert RLS).');
}

verify().catch(err => { console.error('Verification script failed', err); process.exit(1); });
