'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 👑 ARRUPE College Master Admin Loop Fallback Bypass (Direct Frontend Routing)
    if (email === 'kalvithanschool@gmail.com' && password === 'Kalvithan@School2026') {
      setLoading(false);
      // நேரடியாக அட்மின் டேஷ்போர்டிற்குள் அனுமதித்தல்
      router.push('/dashboard/admin');
      return;
    }

    // மற்ற பயனர்களுக்கு மட்டும் லோக்கல் மெமரி/டேட்டாபேஸ் தேடல்
    try {
      // இப்போதைக்கு டெமோவிற்காக லோக்கல் ஸ்டோரேஜில் தேடும் எளிய லாஜிக்
      const storedUsers = localStorage.getItem('school_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const matchedUser = users.find((u: any) => u.email === email);
        
        if (matchedUser) {
          router.push(`/dashboard/${matchedUser.role.toLowerCase()}`);
          return;
        }
      }
      
      setError('Profile not found. Contact administrator.');
    } catch (err) {
      setError('An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4">
      <div className="w-full max-w-md bg-white border border-[#0F2942]/10 p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.svg" alt="ARRUPE College Logo" className="w-24 h-24 mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-[#0F2942]">ARRUPE College</h1>
          <p className="text-xs text-[#0F2942]/60 mt-1">Batticaloa — Management System</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#0F2942]/20 rounded-xl px-4 py-3 text-[#0F2942] focus:outline-none focus:border-[#D95D16] transition-all"
              placeholder="name@arrupe.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F2942] uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#0F2942]/20 rounded-xl px-4 py-3 text-[#0F2942] focus:outline-none focus:border-[#D95D16] transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#D95D16] hover:bg-[#D95D16]/90 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-[#D95D16]/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In Securely'}
          </button>
        </form>
      </div>
    </main>
  );
}
