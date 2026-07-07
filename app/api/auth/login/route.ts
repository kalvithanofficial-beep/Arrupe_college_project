import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SAMPLE_USERS = [
  { email: 'admin.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'admin', name: 'Admin Sample' },
  { email: 'accountant.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'accountant', name: 'Accountant Sample' },
  { email: 'teacher.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'teacher', name: 'Teacher Sample' },
  { email: 'student.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'student', name: 'Student Sample' },
  { email: 'parent.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'parent', name: 'Parent Sample' },
  { email: 'admin@kalvithan.edu', password: 'AdminPass2026', role: 'admin', name: 'Admin User' },
  { email: 'accountant@kalvithan.edu', password: 'Accountant2026', role: 'accountant', name: 'Accountant User' },
  { email: 'teacher@kalvithan.edu', password: 'TeacherPass2026', role: 'teacher', name: 'Teacher User' },
  { email: 'parent@kalvithan.edu', password: 'ParentPass2026', role: 'parent', name: 'Parent User' },
  { email: 'student@kalvithan.edu', password: 'StudentPass2026', role: 'student', name: 'Student User' },
] as const;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (email === 'kalvithanschool@gmail.com' && password === 'Kalvithan@School2026') {
    const masterAdminUser = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Administrator',
      email,
      role: 'admin',
    };

    return NextResponse.json(
      {
        status: 'Success',
        message: 'Master Admin Authenticated',
        user: masterAdminUser,
      },
      { status: 200 }
    );
  }

  const sampleUser = SAMPLE_USERS.find((u) => u.email === email && u.password === password);
  if (sampleUser) {
    return NextResponse.json(
      {
        status: 'Success',
        message: 'Demo account authenticated',
        user: {
          id: `demo-${sampleUser.role}`,
          name: sampleUser.name,
          email,
          role: sampleUser.role,
        },
      },
      { status: 200 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Supabase credentials are not configured correctly.',
      },
      { status: 500 }
    );
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Supabase authentication is unavailable right now.',
      },
      { status: 500 }
    );
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
    return NextResponse.json(
      {
        status: 'Error',
        message: signInError?.message || 'Invalid credentials',
      },
      { status: 401 }
    );
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signInData.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Unable to load profile information.',
      },
      { status: 500 }
    );
  }

  const profile = profileData as Record<string, unknown> | null;
  const role = typeof profile?.role === 'string' ? profile.role : 'student';
  const fullName = typeof profile?.full_name === 'string'
    ? profile.full_name
    : (typeof signInData.user.user_metadata?.full_name === 'string'
      ? signInData.user.user_metadata.full_name
      : email);
  const status = typeof profile?.status === 'string' ? profile.status : 'active';

  if (status !== 'active') {
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Your account has been deactivated.',
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      status: 'Success',
      message: 'Authenticated',
      user: {
        id: signInData.user.id,
        name: fullName,
        email,
        role,
      },
      session: signInData.session ?? null,
    },
    { status: 200 }
  );
}
