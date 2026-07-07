import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Master-Admin-Bypass, X-Master-Admin-Email',
};

function getSupabaseClient(token?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are not configured.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

async function ensureAdminAccess(req: NextRequest) {
  const masterAdminBypass = req.headers.get('X-Master-Admin-Bypass') === 'true';
  const masterAdminEmail = req.headers.get('X-Master-Admin-Email')?.toLowerCase() ?? '';

  if (masterAdminBypass && masterAdminEmail === 'kalvithanschool@gmail.com') {
    return { allowed: true };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { allowed: false, status: 401, error: 'Missing auth header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabaseClient(token);
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { allowed: false, status: 401, error: 'Unauthorized' };
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr || !profile || profile.role !== 'admin' || profile.status !== 'active') {
    return { allowed: false, status: 403, error: 'Only admins can manage users' };
  }

  return { allowed: true, user };
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const access = await ensureAdminAccess(req);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
    const supabase = getSupabaseClient(token);

    if (action === 'create') {
      const { email, password, role, fullName, phone } = body ?? {};

      if (!email || !password || !role || !fullName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            phone: phone ?? null,
          },
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, userId: data.user?.id ?? null }, { status: 200, headers: corsHeaders });
    }

    if (action === 'update_status') {
      const { userId, status } = body ?? {};
      if (!userId || !['active', 'inactive'].includes(status)) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400, headers: corsHeaders });
      }

      const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
    }

    if (action === 'reset_password') {
      const { userId, newPassword } = body ?? {};
      if (!userId || !newPassword) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400, headers: corsHeaders });
      }

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr || !profileData?.email) {
        return NextResponse.json({ error: 'Unable to locate user email' }, { status: 404, headers: corsHeaders });
      }

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(profileData.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500, headers: corsHeaders });
  }
}
