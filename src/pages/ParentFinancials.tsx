import { useEffect, useState } from 'react';
import { Download, CheckCircle2, Clock, AlertCircle, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FeePayment } from '../types';

const SUMMARY = [
  { label: 'Total Paid (2023-24)', value: 'LKR 17,200', icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Pending Dues', value: 'LKR 4,200', icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Next Due Date', value: 'Nov 15, 2023', icon: <AlertCircle size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
];

export default function ParentFinancials() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('fee_payments').select('*').order('payment_date', { ascending: false }).limit(20).then(({ data }) => {
      if (data) setPayments(data as FeePayment[]);
      setLoading(false);
    });
  }, []);

  const upcoming = [
    { label: 'Term 2 Tuition Fee', due: 'Nov 15, 2023', amount: 'LKR 12,500', urgent: true },
    { label: 'Exam Fee', due: 'Dec 1, 2023', amount: 'LKR 800', urgent: false },
    { label: 'Annual Day Contribution', due: 'Dec 10, 2023', amount: 'LKR 500', urgent: false },
  ];

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Fee & Financials</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your child's fee payments and upcoming dues</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {SUMMARY.map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
              {s.icon}
            </div>
            <div>
              <div className="text-lg font-bold text-navy-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Payment history */}
        <div className="xl:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-navy-900">Payment History</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">Academic Year 2023-24</span>
                <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
                  <Download size={14} />
                </button>
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${p.status === 'Paid' ? 'bg-emerald-100' : p.status === 'Pending' ? 'bg-amber-100' : 'bg-red-100'}`}>
                      {p.status === 'Paid'
                        ? <CheckCircle2 size={16} className="text-emerald-600" />
                        : p.status === 'Pending'
                        ? <Clock size={16} className="text-amber-600" />
                        : <AlertCircle size={16} className="text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-navy-900">{p.payment_type}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.student_name} &bull; {p.invoice_id} &bull; {new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-navy-900">LKR {p.amount.toLocaleString('en-IN')}</div>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className={`badge text-xs ${p.status === 'Paid' ? 'badge-paid' : p.status === 'Pending' ? 'badge-pending' : 'badge-overdue'}`}>{p.status}</span>
                        {p.status === 'Paid' && (
                          <button className="text-slate-400 hover:text-accent-600 transition-colors">
                            <Printer size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming dues */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Upcoming Dues</h2>
            <div className="space-y-3">
              {upcoming.map((u, i) => (
                <div key={i} className={`p-3 rounded-xl border ${u.urgent ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-navy-900">{u.label}</span>
                    {u.urgent && <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded">Due Soon</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Due: {u.due}</span>
                    <span className="text-sm font-bold text-navy-900">{u.amount}</span>
                  </div>
                  {u.urgent && (
                    <button className="mt-2 w-full text-xs btn-primary py-1.5">Pay Now</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-3">Payment Summary</h2>
            <div className="space-y-2">
              {[
                { label: 'Tuition Fees', paid: 25000, total: 37500 },
                { label: 'Transport Fees', paid: 6400, total: 9600 },
                { label: 'Lab Fees', paid: 1500, total: 1500 },
              ].map(s => {
                const pct = Math.round((s.paid / s.total) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-medium text-navy-900">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-accent-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
