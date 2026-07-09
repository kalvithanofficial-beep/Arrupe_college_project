import { useEffect, useState, FormEvent } from 'react';
import { DollarSign, AlertCircle, TrendingUp, Filter, Share2, Printer, MoreVertical, Check, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FeePayment, Notice } from '../types';
import StatCard from '../components/ui/StatCard';
import NoticeCard from '../components/ui/NoticeCard';

const PAYMENT_TYPES = ['Tuition Fees', 'Transport Fees', 'Laboratory Fees', 'Library Fees', 'Registration Fee', 'Examination Fee'];
const PAYMENT_MODES = ['Cash', 'Online', 'Cheque', 'DD'];

export default function FinancialDashboard() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    student_name: '',
    amount: '',
    payment_mode: 'Cash',
    reference_no: '',
    remarks: '',
    payment_type: 'Tuition Fees',
    student_class: '',
    status: 'Paid' as 'Paid' | 'Pending' | 'Overdue',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: payData }, { data: noticesData }] = await Promise.all([
      supabase.from('fee_payments').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
    ]);
    if (payData) setPayments(payData as FeePayment[]);
    if (noticesData) setNotices(noticesData as Notice[]);
  }

  function generateInvoiceId() {
    return `#INV-${Math.floor(8000 + Math.random() * 999)}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('fee_payments').insert({
      invoice_id: generateInvoiceId(),
      student_name: form.student_name,
      student_class: form.student_class,
      amount: parseFloat(form.amount),
      payment_type: form.payment_type,
      payment_mode: form.payment_mode,
      reference_no: form.reference_no || null,
      remarks: form.remarks || null,
      status: form.status,
      payment_date: new Date().toISOString().split('T')[0],
    }).select().single();
    setLoading(false);
    if (!error && data) {
      setPayments(prev => [data as FeePayment, ...prev]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm({ student_name: '', amount: '', payment_mode: 'Cash', reference_no: '', remarks: '', payment_type: 'Tuition Fees', student_class: '', status: 'Paid' });
    }
  }

  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = payments.reduce((acc, p) => acc + p.amount, 0);

  function formatLKR(n: number) {
    return `LKR ${n.toLocaleString('en-IN')}`;
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <button className="hover:text-navy-900">Dashboard</button>
        <span>›</span>
        <span className="text-navy-900 font-medium">Financial Overview</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<DollarSign size={18} />}
          label="Monthly Collections"
          value={formatLKR(totalCollected + 400000)}
          change="+12% growth"
          changePositive
        />
        <StatCard
          icon={<AlertCircle size={18} />}
          label="Pending Dues"
          value={formatLKR(totalPending + 80000)}
          badge="Alert: 14 late"
          badgeColor="bg-red-100 text-red-600"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Total Expenses"
          value={formatLKR(totalExpenses + 110000)}
          badge="Operational"
          badgeColor="bg-slate-100 text-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Form + Trends */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Entry Form */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-accent-600" />
                </div>
                <div>
                  <h2 className="font-bold text-navy-900">New Payment Entry</h2>
                </div>
              </div>

              {success && (
                <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs">
                  <Check size={14} /> Payment logged & receipt generated!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Student Name / ID</label>
                    <input
                      value={form.student_name}
                      onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))}
                      placeholder="K-2024-045"
                      className="input-field text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Amount (LKR)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="input-field text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
                  <input
                    value={form.student_class}
                    onChange={e => setForm(p => ({ ...p, student_class: e.target.value }))}
                    placeholder="e.g. Class 10-B"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Payment Type</label>
                  <select value={form.payment_type} onChange={e => setForm(p => ({ ...p, payment_type: e.target.value }))} className="input-field text-sm">
                    {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode</label>
                    <select value={form.payment_mode} onChange={e => setForm(p => ({ ...p, payment_mode: e.target.value }))} className="input-field text-sm">
                      {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Reference No.</label>
                    <input value={form.reference_no} onChange={e => setForm(p => ({ ...p, reference_no: e.target.value }))} placeholder="CHQ 123456" className="input-field text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'Paid' | 'Pending' | 'Overdue' }))} className="input-field text-sm">
                    <option>Paid</option><option>Pending</option><option>Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                  <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Term 2 Admission Fees..." rows={2} className="input-field text-sm resize-none" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Log Payment & Generate Receipt'}
                </button>
              </form>
            </div>

            {/* Collection Trends placeholder */}
            <div className="card p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-accent-500" />
                <h2 className="font-bold text-navy-900">Collection Trends</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl p-6 gap-3">
                <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center">
                  <BarChart3 size={26} className="text-accent-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    Visual analytics for this quarter are being processed. 92% of the budget goals have been met.
                  </p>
                </div>
                <button className="text-accent-600 text-sm font-semibold hover:text-accent-700 border border-accent-200 hover:bg-accent-50 rounded-lg px-4 py-2 transition-colors">
                  View Full Reports
                </button>
              </div>

              {/* Mini bar chart */}
              <div className="mt-4">
                <div className="flex items-end gap-1 h-16">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 10 ? '#e07b39' : '#e2e8f0' }} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Jan</span><span>Jun</span><span>Dec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-navy-900">Recent Fee Payments</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
                  <Filter size={16} />
                </button>
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="pb-3 pr-4">Invoice ID</th>
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.slice(0, 10).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4 text-sm font-medium text-navy-900">{p.invoice_id}</td>
                      <td className="py-3 pr-4">
                        <div className="text-sm font-semibold text-navy-900">{p.student_name}</div>
                        <div className="text-xs text-slate-400">{p.student_class}</div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-600">{p.payment_type}</td>
                      <td className="py-3 pr-4 text-sm font-semibold text-navy-900">LKR {p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${p.status === 'Paid' ? 'bg-emerald-500' : p.status === 'Pending' ? 'bg-amber-400' : 'bg-red-500'}`} />
                          <span className={p.status === 'Paid' ? 'badge-paid' : p.status === 'Pending' ? 'badge-pending' : 'badge-overdue'}>
                            {p.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                            <Printer size={14} />
                          </button>
                          <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Notice Board */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-accent-100 rounded-lg flex items-center justify-center">
                <AlertCircle size={14} className="text-accent-600" />
              </div>
              <h2 className="font-bold text-navy-900">Notice Board</h2>
            </div>
            <div className="space-y-4">
              {notices.map(n => <NoticeCard key={n.id} notice={n} />)}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4 text-sm">System Health</h2>
            {[
              { label: 'Server Status', status: 'Online', color: 'bg-red-400' },
              { label: 'Last Backup', status: '2h ago', color: 'bg-slate-400' },
              { label: 'SMS Gateway', status: 'Active', color: 'bg-emerald-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs font-medium text-slate-700">{item.status}</span>
                </div>
              </div>
            ))}
            <div className="mt-4 rounded-xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Campus"
                className="w-full h-28 object-cover"
              />
              <div className="bg-navy-900 px-3 py-2">
                <div className="text-white text-xs font-semibold">Campus Vision 2025</div>
                <div className="text-slate-400 text-xs">The future of Arrupe College starts here.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
