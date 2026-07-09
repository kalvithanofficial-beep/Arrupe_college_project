import { useEffect, useState, FormEvent } from 'react';
import { AlertTriangle, Check, Download, Shield, FileText, CreditCard, Bus, CheckCircle2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notice } from '../types';

const CHILDREN = [
  { name: 'Arun Kumar', class: 'Class XI-A', attendance: 94, grade: 'A+', pendingDues: 4200 },
  { name: 'Priya Kumar', class: 'Class IX-A', attendance: 88, grade: 'B+', pendingDues: 1500 },
];

export default function ParentDashboard() {
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('parent.support@email.com');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const child = CHILDREN[selectedChildIdx];

  useEffect(() => {
    supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setNotices(data as Notice[]);
    });
  }, []);

  async function handleProfileUpdate(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setProfileLoading(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  }

  const feeHistory = [
    { label: 'Term 2 Tuition Fee', date: 'Paid on 15 Sep 2023', amount: 'LKR 12,500.00', paid: true },
    { label: 'Library & Lab Fees', date: 'Paid on 02 Aug 2023', amount: 'LKR 3,200.00', paid: true },
    { label: 'Registration Fee', date: 'Paid on 20 May 2023', amount: 'LKR 1,500.00', paid: true },
  ];

  const childDocs = [
    { icon: <FileText size={16} />, label: 'Report Card', sub: 'Term 1 — Download' },
    { icon: <CreditCard size={16} />, label: 'Student ID', sub: 'Digital Copy' },
    { icon: <Bus size={16} />, label: 'Transport Pass', sub: '2023-24' },
  ];

  const typeColors: Record<string, string> = {
    INTERNAL: 'bg-slate-400', CIRCULAR: 'bg-accent-500', URGENT: 'bg-red-500',
    ACADEMIC: 'bg-blue-500', HOLIDAY: 'bg-emerald-500', UPDATE: 'bg-violet-500', IMPORTANT: 'bg-orange-500',
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Child selector header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Parent Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor your child's progress and school activities</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowChildPicker(v => !v)}
            className="flex items-center gap-2 border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-50 transition-colors"
          >
            {child.name} — {child.class}
            <ChevronDown size={15} className="text-slate-400" />
          </button>
          {showChildPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowChildPicker(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-52">
                {CHILDREN.map((c, i) => (
                  <button key={i} onClick={() => { setSelectedChildIdx(i); setShowChildPicker(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50 ${selectedChildIdx === i ? 'text-accent-600 font-semibold bg-accent-50' : 'text-slate-700'}`}>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.class}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attendance alert */}
      {showAlert && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              <span className="font-bold">Mandatory Attendance Alert</span> — {child.name} was marked absent today (Oct 24).
              Please confirm via WhatsApp link sent to your registered number.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
              CONFIRM NOW
            </button>
            <button onClick={() => setShowAlert(false)} className="text-amber-400 hover:text-amber-600 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-accent-500 mb-1">{child.attendance}%</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attendance</div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
            <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${child.attendance}%` }} />
          </div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-navy-900 mb-1">{child.grade}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Grade</div>
          <div className="mt-3 text-xs text-emerald-600 font-medium bg-emerald-50 rounded-full px-3 py-1 inline-block">Above Average</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-red-500 mb-1">LKR {child.pendingDues.toLocaleString()}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Dues</div>
          <button className="mt-3 text-xs text-accent-600 font-semibold hover:text-accent-700 border border-accent-200 rounded-full px-3 py-1 hover:bg-accent-50 transition-colors">
            Pay Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Fee History + Profile Update */}
        <div className="xl:col-span-2 space-y-6">
          {/* Fee Payment History */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900 text-lg">Fee Payment History</h2>
              <span className="text-xs bg-slate-100 text-slate-600 font-medium px-3 py-1 rounded-full">Academic Year 2023-24</span>
            </div>
            <div className="space-y-3">
              {feeHistory.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.paid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <CheckCircle2 size={16} className={item.paid ? 'text-emerald-600' : 'text-amber-600'} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-navy-900">{item.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-navy-900">{item.amount}</div>
                    <button className="text-accent-500 text-xs hover:text-accent-600 flex items-center gap-1 mt-0.5">
                      <Download size={11} /> Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-sm text-accent-600 font-semibold hover:text-accent-700 border border-accent-200 py-2 rounded-xl hover:bg-accent-50 transition-colors">
              View Full Payment History
            </button>
          </div>

          {/* Update Profile */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900">Update Profile</h2>
              <Shield size={16} className="text-slate-400" />
            </div>
            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm">
                <Check size={14} /> Profile updated successfully!
              </div>
            )}
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Parent Primary Contact</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input-field" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Shield size={13} />
                  Verification required for sensitive changes
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
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Notice Board</h2>
            <div className="space-y-3">
              {notices.slice(0, 4).map(n => (
                <div key={n.id} className={`border-l-4 ${typeColors[n.notice_type] || 'bg-slate-400'} pl-3 py-1.5`}>
                  <div className="text-xs text-slate-400 mb-0.5">
                    {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-sm font-semibold text-navy-900 leading-tight">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.content}</div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-sm text-accent-600 font-semibold border border-accent-200 py-2 rounded-xl hover:bg-accent-50 transition-colors">
              View All Notices
            </button>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4 text-sm uppercase tracking-wide">Child Documents</h2>
            <div className="space-y-2">
              {childDocs.map(doc => (
                <button key={doc.label} className="w-full flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl p-3 text-left transition-colors">
                  <div className="w-9 h-9 bg-navy-900 rounded-lg flex items-center justify-center text-white shrink-0">
                    {doc.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-navy-900">{doc.label}</div>
                    <div className="text-xs text-slate-400">{doc.sub}</div>
                  </div>
                  <Download size={15} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-3 text-sm">This Week</h2>
            <div className="space-y-2">
              {[
                { label: 'Days Present', value: '4/5', color: 'text-emerald-600' },
                { label: 'Assignments Due', value: '2', color: 'text-amber-600' },
                { label: 'Tests This Week', value: '1', color: 'text-blue-600' },
                { label: 'Notices Unread', value: String(notices.length), color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
