import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
    },
    { status: 200 }
  );
}
