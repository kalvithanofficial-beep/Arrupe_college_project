import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';

export interface UserFormData {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  address: string;
  religion: string;
  role: UserRole;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp?: (email: string, password: string, fullName?: string, role?: UserRole) => Promise<{ error: Error | null }>;
  devSignIn: (email: string, role?: UserRole) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createUserByAdmin: (formData: UserFormData) => Promise<{ error: Error | null; data?: string | Record<string, unknown> }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) {
      setProfile(data as Profile);
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      (async () => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signUp(email: string, password: string, fullName = '', role: UserRole = 'student') {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
    return { error: error as Error | null };
  }

  function devSignIn(email: string, role: UserRole = 'admin') {
    // Create a lightweight fake user and profile for local development/testing.
    const fakeUser = ({ id: `dev:${email}`, email } as unknown) as User;
    const fakeProfile: Profile = {
      id: `dev:${email}`,
      first_name: email.split('@')[0],
      last_name: '',
      full_name: email.split('@')[0],
      role,
      email,
      phone: null,
      age: null,
      gender: null,
      date_of_birth: null,
      address: null,
      religion: null,
      avatar_url: null,
      created_by: null,
      created_at: new Date().toISOString(),
    };

    setUser(fakeUser);
    setSession(null);
    setProfile(fakeProfile);
  }

  async function createUserByAdmin(formData: UserFormData) {
    try {
      const firstName = formData.firstName ?? formData.first_name ?? '';
      const lastName = formData.lastName ?? formData.last_name ?? '';
      const normalizedRole = (formData.role ?? '').toString().toLowerCase();
      const payload = {
        p_email: formData.email,
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: formData.phone || null,
        p_age: formData.age ? Number(formData.age) : null,
        p_gender: formData.gender || null,
        p_date_of_birth: formData.date_of_birth || null,
        p_address: formData.address || null,
        p_religion: formData.religion || null,
        p_role: normalizedRole,
      };

      console.debug('Creating user profile with payload:', payload);
      const { data, error } = await supabase.rpc('create_user_profile', payload);

      if (error) {
        console.error('Supabase RPC Error:', error);
        return { error: error as Error };
      }

      // Handle RPC-reported errors conservatively: if profile already exists, fetch it instead of failing.
      let profileId: string | null = null;

      if (data?.error) {
        const errMsg = String(data.error || '');
        console.warn('create_user_profile returned error:', errMsg);
        if (errMsg.toLowerCase().includes('duplicate key')) {
          // A profile already exists for this auth user — fetch it and proceed.
          const { data: existing, error: fetchErr } = await supabase.from('profiles').select('id').eq('email', formData.email).maybeSingle();
          if (fetchErr || !existing) {
            console.error('Failed to recover existing profile after duplicate error:', fetchErr);
            return { error: new Error(errMsg) };
          }
          profileId = existing.id;
        } else {
          return { error: new Error(errMsg) };
        }
      } else {
        profileId = typeof data === 'string' ? data : data?.user_id ?? data?.id ?? null;
      }

      if (profileId) {
        const updatePayload = {
          phone: formData.phone || null,
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          religion: formData.religion || null,
        };

        const { error: updateError } = await supabase.from('profiles').update(updatePayload).eq('id', profileId);
        if (updateError) {
          console.error('Profile update after RPC failed:', updateError);
          return { error: updateError as Error };
        }
      }

      console.info('Invitation email workflow triggered. Local email previews are available at http://localhost:54321/monitor');
      return { error: null, data };
    } catch (err) {
      console.error('Supabase RPC Error:', err);
      return { error: err as Error };
    }
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: profile?.role ?? null,
        loading,
        signIn,
        signUp,
        devSignIn,
        signOut,
        refreshProfile,
        createUserByAdmin,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
