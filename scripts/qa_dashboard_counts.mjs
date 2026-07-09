import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : null;
}).filter(Boolean));

async function main() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: 'admin@arrupecollege.edu', password: 'Admin@arrupecollege.edu123' });
  console.log('signInError', signInError?.message ?? null);
  if (signInError || !signInData.session) throw new Error('Admin sign-in failed');

  const authed = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await authed.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });

  const today = new Date().toISOString().split('T')[0];
  const [{ count: studentCount }, { count: teacherCount }, { count: presentCount }, { count: totalAttendanceCount }] = await Promise.all([
    authed.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    authed.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    authed.from('attendance_records').select('*', { count: 'exact', head: true }).eq('date', today).eq('present', true),
    authed.from('attendance_records').select('*', { count: 'exact', head: true }).eq('date', today),
  ]);

  console.log('studentCount', studentCount);
  console.log('teacherCount', teacherCount);
  console.log('presentCount', presentCount);
  console.log('totalAttendanceCount', totalAttendanceCount);
}

main().catch(err => {
  console.error('scriptError', err.message);
  process.exit(1);
});
