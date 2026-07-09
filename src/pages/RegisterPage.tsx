import { useState, FormEvent } from 'react';
import { GraduationCap, Eye, EyeOff, Lock, Mail, User, Phone, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface RegisterPageProps {
  onGoToLogin: () => void;
}

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Administrator', desc: 'Full system access' },
  { value: 'teacher', label: 'Teacher', desc: 'Academic management' },
  { value: 'accountant', label: 'Accountant', desc: 'Financial records' },
  { value: 'parent', label: 'Parent', desc: 'Child monitoring' },
  { value: 'student', label: 'Student', desc: 'Academic portal' },
];

export default function RegisterPage({ onGoToLogin }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    if (!signUp) {
      setLoading(false);
      setError('Registration is temporarily unavailable.');
      return;
    }
    const { error } = await signUp(email, password, fullName, role);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Account Created!</h2>
          <p className="text-slate-500 mb-6">
            Your account has been created successfully. You can now sign in to access your portal.
          </p>
          <button onClick={onGoToLogin} className="btn-primary">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-navy-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-wide">ARRUPE COLLEGE</div>
              <div className="text-slate-400 text-xs uppercase tracking-widest">School Management</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Join our portal</h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Create your account to access attendance tracking, grade reports, financial records, and more — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {['Real-time attendance tracking', 'Secure grade & marksheet access', 'Fee payment management', 'Notice board & announcements'].map(f => (
              <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Arrupe College. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          <button onClick={onGoToLogin} className="flex items-center gap-1 text-slate-500 hover:text-navy-900 text-sm mb-6 transition-colors">
            <ChevronLeft size={16} />
            Back to Sign In
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-navy-900">Create Account</h2>
            <p className="text-slate-500 mt-1 text-sm">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Phone (optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`text-left border rounded-lg px-3 py-2.5 transition-all text-sm ${
                      role === r.value
                        ? 'border-accent-500 bg-accent-50 text-accent-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                  </button>
                ))}
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
                  placeholder="Min. 8 characters"
                  className="input-field pl-9 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <button onClick={onGoToLogin} className="text-accent-600 font-semibold hover:text-accent-700">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
