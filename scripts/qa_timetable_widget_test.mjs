import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : null;
}).filter(Boolean));

const baseUrl = 'http://localhost:5173';
const adminEmail = 'admin@arrupecollege.edu';
const adminPassword = 'Admin@arrupecollege.edu123';

async function main() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  console.log('signInError', signInError?.message ?? null);
  if (signInError || !signInData.session) {
    throw new Error('Admin sign-in failed');
  }

  const authed = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await authed.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });

  const today = new Date().getDay();
  const dayOfWeek = today === 0 ? 1 : today;
  const payload = {
    class_name: 'QA Class',
    subject: 'QA Mock Class',
    teacher_name: 'QA Teacher',
    room: 'Lab 1',
    day_of_week: dayOfWeek,
    start_time: '09:00:00',
    end_time: '10:00:00',
  };

  const { data: inserted, error: insertError } = await authed.from('timetable_entries').insert(payload).select('*').single();
  console.log('insertError', insertError?.message ?? null);
  console.log('insertedRow', JSON.stringify(inserted));

  let createdId = inserted?.id ?? null;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[browser:pageerror] ${err.message}`));

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    await page.getByRole('button', { name: /Academic/i }).click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent();
    const hasNoClasses = /No classes scheduled today/i.test(bodyText ?? '');
    const hasMockClass = /QA Mock Class/i.test(bodyText ?? '');

    console.log('beforeCleanup_hasNoClasses', hasNoClasses);
    console.log('beforeCleanup_hasMockClass', hasMockClass);
    console.log('pageBodySnippet', (bodyText ?? '').slice(0, 4000));
  } finally {
    if (createdId) {
      const { error: deleteError } = await authed.from('timetable_entries').delete().eq('id', createdId);
      console.log('deleteError', deleteError?.message ?? null);
    }
    await browser.close();
  }
}

main().catch(err => {
  console.error('scriptError', err.message);
  process.exit(1);
});
