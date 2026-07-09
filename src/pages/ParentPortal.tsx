import { useEffect, useState, FormEvent } from 'react';
import { AlertTriangle, Download, ChevronDown, MessageSquare, Shield, FileText, CreditCard, Bus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notice } from '../types';

const CHILDREN = [
  { name: 'Arun (Class XI-A)', value: 'arun' },
  { name: 'Priya (Class IX-A)', value: 'priya' },
];

export default function ParentPortal() {
  const [selectedChild, setSelectedChild] = useState(CHILDREN[0]);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('parent.support@email.com');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: noticesData } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);
    if (noticesData) setNotices(noticesData as Notice[]);
  }

  async function handleProfileUpdate(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setProfileLoading(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  }

  const childDocs = [
    { icon: <FileText size={16} />, label: 'Report Card', sub: 'Term 1', action: 'download' },
    { icon: <CreditCard size={16} />, label: 'Student ID', sub: 'Digital Copy', action: 'download' },
    { icon: <Bus size={16} />, label: 'Transport Pass', sub: '2023-24', action: 'download' },
  ];

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-navy-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">AC</span>
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-wide">ARRUPE COLLEGE | Parent Portal</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Child selector */}
          <div className="relative">
            <button
              onClick={() => setShowChildPicker(v => !v)}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              {selectedChild.name}
              <ChevronDown size={14} />
            </button>
            {showChildPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChildPicker(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-40">
                  {CHILDREN.map(c => (
                    <button key={c.value} onClick={() => { setSelectedChild(c); setShowChildPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${selectedChild.value === c.value ? 'text-accent-600 font-semibold' : 'text-slate-700'}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="relative p-1.5 text-white/60 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-navy-900" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-300 rounded-full" />
            <span className="text-white text-sm font-medium">Parent Profile</span>
          </div>
        </div>
      </header>

      {/* Alert */}
      <div className="bg-red-900/80 border-b border-red-700/50 px-6 py-3 flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-300 shrink-0" />
        <p className="text-red-200 text-sm flex-1">
          <span className="font-bold">Mandatory Attendance Alert</span> — Arun was marked absent today (Oct 24). Please confirm via WhatsApp link sent to your registered number.
        </p>
        <button className="bg-white text-red-700 text-xs font-bold px-4 py-1.5 rounded hover:bg-red-50 transition-colors">
          CONFIRM NOW
        </button>
      </div>

      <div className="p-6 max-w-screen-xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'ATTENDANCE', value: '94%', color: 'border-accent-500' },
            { label: 'CURRENT GRADE', value: 'A+', color: 'border-accent-500' },
            { label: 'PENDING DUES LKR', value: '4,200.00', color: 'border-accent-500' },
          ].map(s => (
            <div key={s.label} className={`border-2 ${s.color} rounded-xl p-4 text-center`}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-xs mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Fee Payment History */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Fee Payment History</h2>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full">Academic Year 2023-24</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Term 2 Tuition Fee', sub: 'Paid on 15 Sep 2023', amount: 'LKR 12,500.00', status: 'paid' },
                  { label: 'Library & Lab Fees', sub: 'Paid on 02 Aug 2023', amount: 'LKR 3,200.00', status: 'paid' },
                  { label: 'Registration Fee', sub: 'Paid on 20 May 2023', amount: 'LKR 1,500.00', status: 'paid' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{item.label}</div>
                      <div className="text-slate-400 text-xs">{item.sub}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-semibold">{item.amount}</div>
                      <button className="text-accent-400 text-xs hover:text-accent-300 transition-colors">Download Receipt</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Profile */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Update Profile</h2>
                <Shield size={18} className="text-slate-400" />
              </div>

              {profileSuccess && (
                <div className="mb-4 flex items-center gap-2 bg-emerald-900/50 border border-emerald-700 text-emerald-300 px-3 py-2 rounded-lg text-sm">
                  <Check size={14} /> Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Parent Primary Contact</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Shield size={14} className="text-slate-400" />
                    </div>
                    <span className="text-slate-400 text-xs">Verification required for sensitive changes</span>
                  </div>
                  <button type="submit" disabled={profileLoading} className="btn-primary text-sm flex items-center gap-2">
                    {profileLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Request Security OTP'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Notice Board + Documents */}
          <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-accent-400" />
                <h2 className="font-bold text-white">Notice Board</h2>
              </div>
              <div className="space-y-3">
                {notices.slice(0, 3).map(n => (
                  <div key={n.id} className="border-b border-white/10 pb-3 last:border-0">
                    <div className="text-xs text-slate-400 mb-1">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-white text-sm font-semibold">{n.title}</div>
                    <div className="text-slate-400 text-xs mt-0.5 line-clamp-2">{n.content}</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 border border-white/20 text-white text-sm font-medium py-2 rounded-lg hover:bg-white/10 transition-colors">
                View All Notices
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h2 className="font-bold text-white mb-4 text-xs uppercase tracking-widest">Child Documents</h2>
              <div className="space-y-3">
                {childDocs.map(doc => (
                  <button key={doc.label} className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-left transition-colors">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-slate-300">
                      {doc.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{doc.label}</div>
                      <div className="text-slate-400 text-xs">{doc.sub}</div>
                    </div>
                    <Download size={14} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
