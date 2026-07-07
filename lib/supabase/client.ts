'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function createNoopClient(): SupabaseClient {
  const noopQuery = async () => ({ data: null, error: null });
  const noopList = async () => ({ data: [], error: null });

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null },
        error: { message: 'Supabase credentials are not configured correctly.' },
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: noopQuery,
          single: noopQuery,
          order: () => ({
            limit: noopList,
          }),
        }),
        order: () => ({
          limit: noopList,
        }),
        maybeSingle: noopQuery,
        single: noopQuery,
      }),
      insert: noopQuery,
      update: () => ({ eq: noopQuery }),
      delete: () => ({ eq: noopQuery }),
    }),
  } as unknown as SupabaseClient;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const hasValidConfig = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      supabaseAnonKey.startsWith('sb_') &&
      !supabaseUrl.includes('your-project') &&
      !supabaseAnonKey.includes('your-anon-key')
  );

  if (!hasValidConfig) {
    client = createNoopClient();
    return client;
  }

  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    client = createNoopClient();
  }

  return client;
}

export const supabase = getSupabase();
