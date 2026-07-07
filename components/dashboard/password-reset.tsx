'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, ShieldCheck, Smartphone } from 'lucide-react';

export function PasswordResetDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState('');

  const requestOtp = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: 'Failed to send OTP', description: data.error, variant: 'destructive' });
      return;
    }
    setDevOtp(data.devOtp ?? null);
    setStep('verify');
    toast({
      title: 'OTP sent',
      description: data.message + (data.devOtp ? ` (Demo OTP: ${data.devOtp})` : ''),
    });
  };

  const verifyOtp = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      setLoading(false);
      return;
    }
    // Check OTP against the database
    const { data: otpRecord } = await supabase
      .from('otp_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('otp_code', otp)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      toast({ title: 'Invalid OTP', description: 'The OTP you entered is incorrect.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      toast({ title: 'OTP expired', description: 'Please request a new OTP.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Mark OTP as used
    await supabase.from('otp_requests').update({ is_used: true }).eq('id', otpRecord.id);
    setVerifiedOtp(otp);
    setStep('reset');
    setLoading(false);
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Minimum 8 characters.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Password updated', description: 'Your password has been encrypted and updated.' });
    setOpen(false);
    setStep('request');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setDevOtp(null);
    setVerifiedOtp('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setStep('request'); setOtp(''); setNewPassword(''); setConfirmPassword(''); setDevOtp(null); } }}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200">
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D95D16]" />
            Secure Password Reset
          </DialogTitle>
        </DialogHeader>

        {step === 'request' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-[#D95D16] mt-0.5" />
              <p className="text-xs text-[#0F2942]/70">
                A 6-digit OTP will be sent to your registered mobile number via SMS. You must verify the OTP before changing your password.
              </p>
            </div>
            <Button onClick={requestOtp} disabled={loading} className="w-full btn-amber">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
              Send OTP to My Mobile
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-3">
            <div>
              <Label>Enter 6-digit OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-2xl tracking-[0.5em] font-bold"
                maxLength={6}
              />
            </div>
            {devOtp && (
              <p className="text-xs text-center text-[#D95D16] font-semibold">
                Demo OTP: <span className="font-mono">{devOtp}</span>
              </p>
            )}
            <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full btn-amber">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify OTP
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={requestOtp}>
              Resend OTP
            </Button>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-3">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> OTP verified. Set your new password.
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <Button onClick={resetPassword} disabled={loading} className="w-full btn-amber">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Update Password (Bcrypt Encrypted)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
