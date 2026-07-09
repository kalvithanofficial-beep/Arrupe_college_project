import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : null;
}).filter(Boolean));

const baseUrl = 'http://localhost:5173';
const adminEmail = 'admin@arrupecollege.edu';
const adminPassword = 'Admin@arrupecollege.edu123';
const bucketName = 'term-results';
const fileName = 'qa-term-results.csv';
const fileContent = 'student_id,subject,score\n1,Math,92\n2,Science,88\n';

async function main() {
  const tempDir = path.join(process.cwd(), 'scripts', 'tmp');
  fs.mkdirSync(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, fileName);
  fs.writeFileSync(tempFile, fileContent);
  console.log('tempFile', tempFile);

  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  console.log('signInError', signInError?.message ?? null);
  if (signInError || !signInData.session) {
    throw new Error('Admin sign-in failed');
  }

  const authed = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  await authed.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });

  const { data: buckets, error: bucketsError } = await authed.storage.listBuckets();
  console.log('listBucketsError', bucketsError?.message ?? null);
  console.log('bucketCount', buckets?.length ?? 0);
  console.log('bucketNames', (buckets ?? []).map(b => b.name));

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

    const input = page.locator('#file-upload');
    await input.setInputFiles(tempFile);
    await page.waitForTimeout(1000);

    const uploadLabel = await page.locator('body').textContent();
    console.log('uiLabelChanged', /qa-term-results\.csv/i.test(uploadLabel ?? ''));
    console.log('bodySnippet', (uploadLabel ?? '').slice(0, 2500));
  } finally {
    try {
      const fileBuffer = fs.readFileSync(tempFile);
      const { data, error } = await authed.storage.from(bucketName).upload(fileName, fileBuffer, { contentType: 'text/csv', upsert: true });
      console.log('storageUploadData', JSON.stringify(data));
      console.log('storageUploadError', error?.message ?? null);
      if (!error) {
        const { data: listData, error: listError } = await authed.storage.from(bucketName).list();
        console.log('storageListError', listError?.message ?? null);
        console.log('storageList', JSON.stringify(listData ?? []));
        const { error: removeError } = await authed.storage.from(bucketName).remove([fileName]);
        console.log('storageRemoveError', removeError?.message ?? null);
      }
    } catch (err) {
      console.log('storageException', err.message);
    }
    await browser.close();
  }
}

main().catch(err => {
  console.error('scriptError', err.message);
  process.exit(1);
});
