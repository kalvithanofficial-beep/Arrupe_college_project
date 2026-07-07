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
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: Profile['role'] }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAuthState: (nextUser: User | null, nextProfile: Profile | null, nextSession?: Session | null, nextLoading?: boolean) => void;
}

const AUTH_STORAGE_KEY = 'arrupe-auth-session';

const DEMO_USERS = [
  { email: 'admin.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'admin' as const, name: 'Admin Sample' },
  { email: 'accountant.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'accountant' as const, name: 'Accountant Sample' },
  { email: 'teacher.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'teacher' as const, name: 'Teacher Sample' },
  { email: 'student.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'student' as const, name: 'Student Sample' },
  { email: 'parent.sample@arrupe.edu.lk', password: 'Arrupe@123', role: 'parent' as const, name: 'Parent Sample' },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeProfile(profile: Partial<Profile> | null | undefined): Profile | null {
  if (!profile) return null;
  return {
    ...(profile as Profile),
    id: String(profile.id || ''),
    email: String(profile.email || ''),
    role: String(profile.role || 'student').toLowerCase() as Profile['role'],
    full_name: String(profile.full_name || profile.email || 'User'),
    status: (profile.status as Profile['status']) || 'active',
  };
}

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

  const syncAuthState = useCallback((nextUser: User | null, nextProfile: Profile | null, nextSession: Session | null = null, nextLoading: boolean = false) => {
    setUser((currentUser) => {
      if (!nextUser) return null;
      if (currentUser?.id === nextUser.id && currentUser?.email === nextUser.email) return currentUser;
      return nextUser;
    });
    setProfile((currentProfile) => {
      const normalized = normalizeProfile(nextProfile);
      if (!normalized) return null;
      if (currentProfile?.id === normalized.id && currentProfile?.role === normalized.role) return currentProfile;
      return normalized;
    });
    setSession((currentSession) => {
      if (!nextSession) return null;
      if (currentSession?.access_token === nextSession.access_token) return currentSession;
      return nextSession;
    });
    setLoading(nextLoading);

    if (nextUser) {
      writeStoredAuth(nextUser, normalizeProfile(nextProfile));
    } else {
      clearStoredAuth();
    }
  }, []);

  const loadProfile = useCallback(async (uid: string, nextUser: User | null = null) => {
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
    const normalizedProfile = normalizeProfile(nextProfile);
    setProfile((currentProfile) => {
      if (!normalizedProfile) return null;
      if (currentProfile?.id === normalizedProfile.id && currentProfile?.role === normalizedProfile.role) return currentProfile;
      return normalizedProfile;
    });
    if (nextUser) {
      writeStoredAuth(nextUser, normalizedProfile);
    }
    return normalizedProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id, user);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    const storedAuth = readStoredAuth();
    if (storedAuth?.user) {
      setUser(storedAuth.user as User);
      setProfile(normalizeProfile(storedAuth.profile));
      setLoading(false);
    }

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        const nextProfile = await loadProfile(session.user.id, session.user);
        syncAuthState(session.user, nextProfile ?? null, session, false);
        return;
      }

      if (!storedAuth?.user) {
        syncAuthState(null, null, null, false);
        return;
      }

      setLoading(false);
    };

    void initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const nextProfile = await loadProfile(session.user.id, session.user);
        syncAuthState(session.user, nextProfile ?? null, session, false);
      } else {
        syncAuthState(null, null, null, false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile, syncAuthState]);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const data = await response.json().catch(() => ({} as any));

    if (!response.ok || data.status !== 'Success' || !data.user) {
      return { error: data.message || 'Unable to sign in. Please try again.' };
    }

    const role = typeof data.user.role === 'string' ? data.user.role.toLowerCase() : 'student';
    const nextProfile = {
      id: data.user.id ?? normalizedEmail,
      email: data.user.email ?? normalizedEmail,
      role: role as Profile['role'],
      full_name: data.user.name ?? data.user.full_name ?? normalizedEmail,
      status: 'active',
    } as Profile;

    const nextUser = {
      id: nextProfile.id,
      email: nextProfile.email,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: nextProfile.full_name },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    if (data.session) {
      await supabase.auth.setSession(data.session);
    }

    syncAuthState(nextUser, nextProfile, data.session ?? null, false);
    return { error: null, role: nextProfile.role };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    syncAuthState(null, null, null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, refreshProfile, setAuthState: syncAuthState }}>
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
