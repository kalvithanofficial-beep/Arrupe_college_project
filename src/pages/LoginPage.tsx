import { useState, FormEvent } from 'react';
import { GraduationCap, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, supabaseConfigOk } from '../lib/supabase';
import LeftHeroStats from '../components/LeftHeroStats';


export function PasswordResetPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError(updateError.message || 'Unable to update your password right now.');
      } else {
        setSuccess('Your password has been updated successfully. You can now sign in with your new password.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100">
            <Lock size={24} className="text-accent-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">Reset your password</h2>
          <p className="mt-2 text-sm text-slate-500">Choose a strong new password to secure your account.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-800">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                className="input-field pl-9 pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-800">Confirm New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="input-field pl-9 pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();
    console.log('Attempting login for:', trimmedEmail);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        console.error('Login error:', authError.message);
        throw authError;
      }

      console.log('Login success for:', trimmedEmail);
      window.location.href = '/';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Login exception:', errorMessage);
      setError(errorMessage || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-navy-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-wide">ARRUPE COLLEGE</div>
              <div className="text-slate-400 text-xs uppercase tracking-widest">School Management</div>
            </div>
          </div>
        </div>

          <LeftHeroStats />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            System operational &nbsp;&bull;&nbsp; Secure encrypted connection
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <div>
              <div className="text-navy-900 font-bold text-lg">ARRUPE COLLEGE</div>
              <div className="text-slate-400 text-xs">School Management</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-navy-900">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          {!supabaseConfigOk() && (
            <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} className="shrink-0" />
              Supabase configuration is missing. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in your .env and restart the dev server.
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@arrupecollege.edu"
                  className="input-field pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-9 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end mt-1 mb-2">
                <button
                  type="button"
                  onClick={async () => {
                    const emailValue = email.trim();

                    setResetMessage(null);
                    setResetError(null);

                    if (!emailValue) {
                      setResetError('Please enter your email address first.');
                      return;
                    }

                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });

                      if (error) {
                        console.log('Supabase Mail Blocked:', error.message);

                        if (error.message.toLowerCase().includes('invalid')) {
                          setResetError('Please enter a valid email address.');
                        } else {
                          setResetMessage('If an account exists for this email, a password reset link has been sent. Please check your inbox or spam folder.');
                        }
                      } else {
                        setResetMessage('If an account exists for this email, a password reset link has been sent. Please check your inbox or spam folder.');
                      }
                    } catch (err) {
                      console.error('Catch block error:', err);
                      setResetError('An unexpected error occurred.');
                    }
                  }}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              {resetMessage && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {resetMessage}
                </div>
              )}
              {resetError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {resetError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-600 text-sm bg-slate-100 rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-1">Need an account?</p>
            <p className="text-slate-600">Contact your administrator to create a new account.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
