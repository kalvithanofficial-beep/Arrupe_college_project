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
if (!url || !key) throw new Error('Missing .env values');
const anon = createClient(url, key, { auth: { persistSession: false } });

async function testSignIn(email, password) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  console.log('signIn', email, 'error:', error?.message ?? null);
  console.log('signIn data:', JSON.stringify(data, null, 2));
  return { data, error };
}

async function testInsertUpdateDelete(client, label) {
  const row = {
    invoice_id: `#TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    student_name: 'RLS Verify',
    student_class: 'Grade 10',
    amount: 100.0,
    payment_type: 'Tuition Fees',
    payment_mode: 'Cash',
    status: 'Paid',
    payment_date: new Date().toISOString().slice(0, 10),
  };
  const insert = await client.from('fee_payments').insert(row).select('*');
  console.log(`${label} insert error:`, insert.error?.message ?? null);
  console.log(`${label} insert data:`, JSON.stringify(insert.data, null, 2));
  const id = insert.data?.[0]?.id;
  if (!id) return;
  const update = await client.from('fee_payments').update({ remarks: 'test update' }).eq('id', id).select('*');
  console.log(`${label} update error:`, update.error?.message ?? null);
  const del = await client.from('fee_payments').delete().eq('id', id).select('*');
  console.log(`${label} delete error:`, del.error?.message ?? null);
}

async function withAuthenticatedSession(email, password, fn) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) {
    console.log('login failed for', email, error.message);
    return null;
  }
  const session = data.session;
  if (!session) {
    console.log('no session returned for', email);
    return null;
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  return fn(client, session.user.id);
}

async function main() {
  console.log('--- Admin verification ---');
  await withAuthenticatedSession('admin@arrupecollege.edu', 'Admin@arrupecollege.edu123', async (client) => {
    await testInsertUpdateDelete(client, 'Admin');
  });

  console.log('\n--- Existing teacher verification ---');
  await withAuthenticatedSession('teacher@arrupecollege.edu', 'Demo@1234', async (client) => {
    await testInsertUpdateDelete(client, 'Teacher');
  });

  console.log('\n--- New teacher onboarding and verification ---');
  const teacherEmail = `qa.teacher.${Date.now()}@arrupecollege.edu`;
  const teacherPassword = 'Test@1234';
  const signup = await anon.auth.signUp({ email: teacherEmail, password: teacherPassword, options: { data: { role: 'teacher' } } });
  console.log('New teacher signup error:', signup.error?.message ?? null);
  console.log('New teacher signup user:', JSON.stringify(signup.data?.user ?? null, null, 2));
  if (!signup.data?.user) return;
  await withAuthenticatedSession('admin@arrupecollege.edu', 'Admin@arrupecollege.edu123', async (client) => {
    const { data: rpcData, error: rpcError } = await client.rpc('create_user_profile', {
      p_email: teacherEmail,
      p_first_name: 'QA',
      p_last_name: 'Teacher',
      p_phone: null,
      p_age: null,
      p_gender: null,
      p_date_of_birth: null,
      p_address: null,
      p_religion: null,
      p_role: 'teacher',
    });
    console.log('create_user_profile rpc error:', rpcError?.message ?? null);
    console.log('create_user_profile rpc data:', JSON.stringify(rpcData, null, 2));
  });
  await withAuthenticatedSession(teacherEmail, teacherPassword, async (client) => {
    await testInsertUpdateDelete(client, 'New Teacher');
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
