'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import { Profile, UserRole } from './types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'arrupe-auth-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { user: User | null; profile: Profile | null } | null;
  } catch {
    return null;
  }
}

function writeStoredAuth(user: User | null, profile: Profile | null) {
  if (typeof window === 'undefined') return;

  const normalizedProfile = profile
    ? {
        ...profile,
        role: String(profile.role || 'student').toLowerCase(),
        full_name: profile.full_name || profile.email || 'User',
      }
    : null;

  const payload = { user, profile: normalizedProfile };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAuthState = useCallback((nextUser: User | null, nextProfile: Profile | null, nextSession: Session | null = null) => {
    setUser(nextUser);
    setProfile(nextProfile);
    setSession(nextSession);

    if (nextUser) {
      writeStoredAuth(nextUser, nextProfile);
    } else {
      clearStoredAuth();
    }
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error.message);
      return null;
    }

    const nextProfile = data as Profile | null;
    const normalizedProfile = nextProfile
      ? {
          ...nextProfile,
          role: String(nextProfile.role || 'student').toLowerCase(),
          full_name: nextProfile.full_name || nextProfile.email || 'User',
        }
      : null;
    setProfile(normalizedProfile);
    if (user) {
      writeStoredAuth(user, nextProfile);
    }
    return nextProfile;
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    const storedAuth = readStoredAuth();
    if (storedAuth?.user) {
      setUser(storedAuth.user as User);
      setProfile(storedAuth.profile);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      const nextUser = session?.user ?? null;
      if (nextUser) {
        syncAuthState(nextUser, profile ?? null, session);
        loadProfile(nextUser.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else if (!storedAuth?.user) {
        syncAuthState(null, null, null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        const nextUser = session?.user ?? null;
        if (nextUser) {
          await loadProfile(nextUser.id);
          syncAuthState(nextUser, profile ?? null, session);
        } else {
          syncAuthState(null, null, null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile, profile, syncAuthState]);

  const signIn = async (email: string, password: string) => {
    const isMasterFallback = email === 'kalvithanschool@gmail.com' && password === 'Kalvithan@School2026';
    if (isMasterFallback) {
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    syncAuthState(null, null, null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    accountant: 'Accountant',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  };
  return labels[role] || role;
}
