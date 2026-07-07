'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Shield, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading, setAuthState } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && profile) {
      router.replace(`/dashboard/${profile.role}`);
    }
  }, [loading, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.status !== 'Success') {
        setError(data.message || 'Unable to sign in. Please try again.');
        setSubmitting(false);
        return;
      }

      const role = String(data.user?.role || 'student').toLowerCase();
      const normalizedRole = role === 'admin' ? 'admin' : role;
      const nextProfile = {
        id: data.user?.id || email,
        email: data.user?.email || email,
        role: normalizedRole,
        full_name: data.user?.name || email,
        status: 'active',
      } as any;

      const nextUser = {
        id: nextProfile.id,
        email: nextProfile.email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: nextProfile.full_name },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any;

      setAuthState(nextUser, nextProfile, null, false);

      toast({ title: 'Welcome back!', description: `Signed in as ${normalizedRole}` });
      router.replace(`/dashboard/${normalizedRole}`);
    } catch {
      setError('Unable to reach the authentication service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FAF8F3]">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#0F2942]/6 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#D95D16]/8 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#0F2942]/4 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Image
            src="/logo.svg"
            alt="ARRUPE College Logo"
            width={96}
            height={96}
            className="w-24 h-24 mb-4 mx-auto object-contain"
            priority
          />
          <h1 className="text-3xl font-bold text-[#0F2942] tracking-tight">ARRUPE College</h1>
          <p className="text-sm text-[#0F2942]/70 mt-1 font-medium">Batticaloa — Management System</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0F2942]">Sign in to your account</h2>
            <p className="text-sm text-[#0F2942]/60 mt-1">
              Access is restricted. Accounts are created by authorised administrators only.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-slide-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0F2942] font-medium text-sm">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F2942]/50" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@arrupe.edu.lk"
                  className="pl-10 h-11 bg-white border-[#E5E7EB] focus:border-[#D95D16] focus:ring-[#D95D16]/20 text-[#0F2942]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0F2942] font-medium text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F2942]/50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 bg-white border-[#E5E7EB] focus:border-[#D95D16] focus:ring-[#D95D16]/20 text-[#0F2942]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F2942]/50 hover:text-[#0F2942]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#D95D16] hover:bg-[#b54d10] text-white font-semibold rounded-xl shadow-lg shadow-[#D95D16]/30 transition-all duration-200 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In Securely'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs text-[#0F2942]/60">
              <Shield className="w-3.5 h-3.5" />
              <span>
                Passwords encrypted with Bcrypt. No public signup. RBAC enforced.
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#0F2942]/50 mt-6">
          ARRUPE College, Batticaloa &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
}
