'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Invoice, Payment, Student, SchoolClass } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { downloadInvoicePDF } from '@/lib/pdf';
import {
  Receipt, Plus, DollarSign, TrendingUp, Loader2, FileText, Banknote, CreditCard, Building2, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountantDashboardProps {
  section: string;
}

export function AccountantDashboard({ section }: AccountantDashboardProps) {
  if (section === 'overview') return <AccountantOverview />;
  if (section === 'invoices') return <ManageInvoices />;
  if (section === 'payments') return <ManagePayments />;
  return <AccountantOverview />;
}

function AccountantOverview() {
  const [stats, setStats] = useState({ collected: 0, pending: 0, invoices: 0, students: 0 });
  const [methodBreakdown, setMethodBreakdown] = useState({ cash: 0, cheque: 0, bank_deposit: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: invoices, error: invoicesError }, { count: studentCount, error: studentsError }, { data: payments, error: paymentsError }] = await Promise.all([
          supabase.from('invoices').select('total_amount, amount_paid, status'),
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('amount, payment_method, payment_date, students(full_name)').order('payment_date', { ascending: false }).limit(8),
        ]);

        if (invoicesError || studentsError || paymentsError) {
          console.warn('[accountant/overview] finance data warning', { invoicesError, studentsError, paymentsError });
        }

        const safeInvoices = (invoices ?? []) as Array<{ total_amount: number; amount_paid: number; status: string }>;
        const collected = safeInvoices.reduce((s: number, i: any) => s + Number(i.amount_paid), 0);
        const pending = safeInvoices.reduce((s: number, i: any) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);

        const breakdown = { cash: 0, cheque: 0, bank_deposit: 0 };
        (payments ?? []).forEach((p: any) => {
          const method = p.payment_method as keyof typeof breakdown;
          if (method in breakdown) {
            breakdown[method] += Number(p.amount);
          }
        });

        setStats({ collected, pending, invoices: safeInvoices.length ?? 0, students: studentCount ?? 0 });
        setMethodBreakdown(breakdown);
        setRecentPayments((payments ?? []) as any[]);
      } catch (error: any) {
        console.warn('[accountant/overview] load failed', error?.message || error);
        setStats({ collected: 0, pending: 0, invoices: 0, students: 0 });
        setMethodBreakdown({ cash: 0, cheque: 0, bank_deposit: 0 });
        setRecentPayments([]);
      }
    })();
  }, []);

  const cards = [
    { label: 'Total Collected', value: `Rs. ${stats.collected.toFixed(0)}`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Pending Dues', value: `Rs. ${stats.pending.toFixed(0)}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
    { label: 'Invoices', value: stats.invoices, icon: Receipt, color: 'from-green-500 to-green-600' },
    { label: 'Students', value: stats.students, icon: FileText, color: 'from-teal-500 to-teal-600' },
  ];

  const totalMethods = methodBreakdown.cash + methodBreakdown.cheque + methodBreakdown.bank_deposit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="stat-card">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', c.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-[#0F2942]">{c.value}</p>
              <p className="text-xs text-[#0F2942]/60 font-medium">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-5 h-5 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Payment Method Breakdown</h3>
          </div>
          {totalMethods === 0 ? (
            <p className="text-xs text-[#0F2942]/50 text-center py-6">No payments logged yet.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Cash', value: methodBreakdown.cash, icon: Banknote, color: 'bg-emerald-500' },
                { label: 'Cheque', value: methodBreakdown.cheque, icon: CreditCard, color: 'bg-blue-500' },
                { label: 'Bank Deposit', value: methodBreakdown.bank_deposit, icon: Building2, color: 'bg-purple-500' },
              ].map((m) => {
                const pct = totalMethods > 0 ? (m.value / totalMethods) * 100 : 0;
                const Icon = m.icon;
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-xs font-medium text-[#0F2942]">
                        <Icon className="w-3.5 h-3.5" /> {m.label}
                      </span>
                      <span className="text-xs font-bold text-[#0F2942]">Rs. {m.value.toFixed(0)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#FAF8F3] overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', m.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Recent Payments</h3>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-[#0F2942]/50 text-center py-6">No payments logged yet.</p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p.id ?? `${p.payment_date}-${p.amount}`} className="flex items-center gap-2 p-2 rounded-lg bg-white/40">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    {p.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-emerald-600" /> :
                     p.payment_method === 'cheque' ? <CreditCard className="w-4 h-4 text-blue-600" /> :
                     <Building2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#0F2942] truncate">{p.students?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-[#0F2942]/50">{p.payment_date} | {p.payment_method.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">Rs. {Number(p.amount).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-[#D95D16]" />
          <h3 className="font-bold text-[#0F2942]">Finance-Only Access</h3>
        </div>
        <p className="text-sm text-[#0F2942]/70 leading-relaxed">
          As an Accountant, you have exclusive access to financial operations: creating invoices,
          logging offline payments (Cash, Cheque, Bank Deposit), and printing PDF receipts. You are
          completely locked out of academic records (marks, attendance) per RBAC policy.
        </p>
      </div>
    </div>
  );
}

function ManageInvoices() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<(Invoice & { students?: any })[]>([]);
  const [students, setStudents] = useState<(Student & { classes?: SchoolClass })[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    term: 'Term 1',
    academic_year: '2025-2026',
    tuition_fee: '5000',
    library_fee: '500',
    lab_fee: '500',
    sports_fee: '300',
    other_fee: '200',
    due_date: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, stu] = await Promise.all([
        supabase.from('invoices').select('*, students(full_name, admission_number, classes(name))').order('created_at', { ascending: false }),
        supabase.from('students').select('*, classes(name)'),
      ]);

      if (inv.error) {
        console.warn('[accountant/invoices] load warning', inv.error.message);
      }
      if (stu.error) {
        console.warn('[accountant/invoices] students warning', stu.error.message);
      }

      setInvoices((inv.data as any) ?? []);
      setStudents((stu.data as any) ?? []);
    } catch (error: any) {
      console.error('[accountant/invoices] load failed', error);
      toast({ title: 'Unable to load invoices', description: error?.message || 'Please check your access permissions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.student_id) {
      toast({ title: 'Select a student', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const total = Number(form.tuition_fee) + Number(form.library_fee) + Number(form.lab_fee) + Number(form.sports_fee) + Number(form.other_fee);
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    const { error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      student_id: form.student_id,
      term: form.term,
      academic_year: form.academic_year,
      tuition_fee: Number(form.tuition_fee),
      library_fee: Number(form.library_fee),
      lab_fee: Number(form.lab_fee),
      sports_fee: Number(form.sports_fee),
      other_fee: Number(form.other_fee),
      total_amount: total,
      amount_paid: 0,
      status: 'unpaid',
      due_date: form.due_date || null,
      created_by: user!.id,
    });
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Invoice created', description: `${invoiceNumber} for Rs. ${total}` });
    setCreateOpen(false);
    load();
  };

  const printReceipt = async (invoice: Invoice & { students?: any }) => {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('payment_date');
    downloadInvoicePDF(invoice, invoice.students, payments ?? []);
    toast({ title: 'Receipt downloaded', description: invoice.invoice_number });
  };

  const statusBadge = (s: string) => s === 'paid' ? 'badge-paid' : s === 'partial' ? 'badge-partial' : 'badge-unpaid';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0F2942]">Invoices</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-amber"><Plus className="w-4 h-4 mr-2" /> Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Fee Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Student</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} ({s.admission_number ?? 'No adm#'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
              </div>
              <div>
                <Label>Tuition Fee (Rs.)</Label>
                <Input type="number" value={form.tuition_fee} onChange={(e) => setForm({ ...form, tuition_fee: e.target.value })} />
              </div>
              <div>
                <Label>Library Fee (Rs.)</Label>
                <Input type="number" value={form.library_fee} onChange={(e) => setForm({ ...form, library_fee: e.target.value })} />
              </div>
              <div>
                <Label>Lab Fee (Rs.)</Label>
                <Input type="number" value={form.lab_fee} onChange={(e) => setForm({ ...form, lab_fee: e.target.value })} />
              </div>
              <div>
                <Label>Sports Fee (Rs.)</Label>
                <Input type="number" value={form.sports_fee} onChange={(e) => setForm({ ...form, sports_fee: e.target.value })} />
              </div>
              <div>
                <Label>Other Fee (Rs.)</Label>
                <Input type="number" value={form.other_fee} onChange={(e) => setForm({ ...form, other_fee: e.target.value })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40 text-sm font-semibold text-[#0F2942]">
              Total: Rs. {(Number(form.tuition_fee) + Number(form.library_fee) + Number(form.lab_fee) + Number(form.sports_fee) + Number(form.other_fee)).toFixed(2)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={create}>Create Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No invoices yet. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-4 py-3">Invoice #</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Term</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-right px-4 py-3">Paid</th>
                  <th className="text-right px-4 py-3">Balance</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const balance = Number(inv.total_amount) - Number(inv.amount_paid);
                  return (
                    <tr key={inv.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                      <td className="px-4 py-3 font-mono text-xs text-[#0F2942]">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-medium text-[#0F2942]">{inv.students?.full_name ?? '-'}</td>
                      <td className="px-4 py-3 text-[#0F2942]/70">{inv.term}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0F2942]">{Number(inv.total_amount).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium">{Number(inv.amount_paid).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-red-700 font-medium">{balance.toFixed(0)}</td>
                      <td className="px-4 py-3"><Badge className={statusBadge(inv.status)}>{inv.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => printReceipt(inv)}>
                          <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ManagePayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<(Payment & { students?: any; invoices?: any })[]>([]);
  const [invoices, setInvoices] = useState<(Invoice & { students?: any })[]>([]);
  const [paymentStats, setPaymentStats] = useState({ offlineCollected: 0, outstandingBalance: 0, unpaidInvoices: 0, paidStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    payment_reference: '',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pmt, inv] = await Promise.all([
        supabase.from('payments').select('*, students(full_name, admission_number, classes(name)), invoices(invoice_number, total_amount, amount_paid, status, term, academic_year)').order('payment_date', { ascending: false }),
        supabase.from('invoices').select('*, students(full_name, admission_number, classes(name))').in('status', ['unpaid', 'partial']).order('created_at', { ascending: false }),
      ]);

      if (pmt.error) {
        console.warn('[accountant/payments] payments warning', pmt.error.message);
      }
      if (inv.error) {
        console.warn('[accountant/payments] invoices warning', inv.error.message);
      }

      const paymentData = (pmt.data as any[]) ?? [];
      const invoiceData = (inv.data as any[]) ?? [];
      const offlineCollected = paymentData.reduce((sum, item) => sum + Number(item.amount), 0);
      const outstandingBalance = invoiceData.reduce((sum, item) => sum + (Number(item.total_amount) - Number(item.amount_paid)), 0);
      const paidStudents = new Set(paymentData.map((item) => item.student_id)).size;
      setPaymentStats({
        offlineCollected,
        outstandingBalance,
        unpaidInvoices: invoiceData.length,
        paidStudents,
      });
      setPayments(paymentData);
      setInvoices(invoiceData);
    } catch (error: any) {
      console.error('[accountant/payments] load failed', error);
      toast({ title: 'Unable to load payments', description: error?.message || 'Please check your access permissions.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const log = async () => {
    if (!form.invoice_id || !form.amount) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const invoice = invoices.find((i) => i.id === form.invoice_id);
    if (!invoice) return;
    const amount = Number(form.amount);
    const newPaid = Number(invoice.amount_paid) + amount;
    const newStatus = newPaid >= Number(invoice.total_amount) ? 'paid' : 'partial';

    const { error: pmtErr } = await supabase.from('payments').insert({
      invoice_id: form.invoice_id,
      student_id: invoice.student_id,
      amount,
      payment_method: form.payment_method,
      payment_reference: form.payment_reference || null,
      payment_date: form.payment_date,
      notes: form.notes || null,
      received_by: user!.id,
    });

    if (pmtErr) {
      toast({ title: 'Failed', description: pmtErr.message, variant: 'destructive' });
      return;
    }

    await supabase.from('invoices').update({ amount_paid: newPaid, status: newStatus }).eq('id', invoice.id);

    toast({ title: 'Payment logged', description: `Rs. ${amount} via ${form.payment_method}` });
    setLogOpen(false);
    setForm({ ...form, invoice_id: '', amount: '', payment_reference: '', notes: '' });
    load();
  };

  const methodIcon = (m: string) => {
    if (m === 'cash') return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
    if (m === 'cheque') return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
    return <Building2 className="w-3.5 h-3.5 text-purple-600" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0F2942]">Offline Payments Log</h2>
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-amber"><Plus className="w-4 h-4 mr-2" /> Log Payment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Offline Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Invoice</Label>
                <Select value={form.invoice_id} onValueChange={(v) => setForm({ ...form, invoice_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select unpaid invoice" /></SelectTrigger>
                  <SelectContent>
                    {invoices.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.invoice_number} - {i.students?.full_name} (Bal: Rs. {(Number(i.total_amount) - Number(i.amount_paid)).toFixed(0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (Rs.)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference (cheque no / deposit slip)</Label>
                <Input value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button onClick={log}>Log Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No payments logged yet.</div>
        ) : (
          <>
            <div className="glass-card rounded-2xl p-5 mb-4">
              <h3 className="font-bold text-[#0F2942] text-sm mb-3">Outstanding Payments</h3>
              {invoices.length === 0 ? (
                <p className="text-xs text-[#0F2942]/50">There are no unpaid or partially paid invoices at the moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mb-4">
                    <thead className="table-head">
                      <tr>
                        <th className="text-left px-4 py-3">Student</th>
                        <th className="text-left px-4 py-3">Class</th>
                        <th className="text-left px-4 py-3">Invoice #</th>
                        <th className="text-left px-4 py-3">Term / Year</th>
                        <th className="text-right px-4 py-3">Total</th>
                        <th className="text-right px-4 py-3">Paid</th>
                        <th className="text-right px-4 py-3">Balance</th>
                        <th className="text-left px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => {
                        const balance = Number(inv.total_amount) - Number(inv.amount_paid);
                        return (
                          <tr key={inv.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                            <td className="px-4 py-3 font-medium text-[#0F2942]">{inv.students?.full_name ?? '-'}</td>
                            <td className="px-4 py-3 text-[#0F2942]/70">{inv.students?.classes?.name ?? '-'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-[#0F2942]">{inv.invoice_number}</td>
                            <td className="px-4 py-3 text-[#0F2942]/70">{`${inv.term ?? '-'} / ${inv.academic_year ?? '-'}`}</td>
                            <td className="px-4 py-3 text-right text-[#0F2942]">Rs. {Number(inv.total_amount).toFixed(0)}</td>
                            <td className="px-4 py-3 text-right text-emerald-700">Rs. {Number(inv.amount_paid).toFixed(0)}</td>
                            <td className="px-4 py-3 text-right text-red-700">Rs. {balance.toFixed(0)}</td>
                            <td className="px-4 py-3"><Badge className={statusBadge(inv.status)}>{inv.status}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-right px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                    <td className="px-4 py-3 text-[#0F2942]/70">{p.payment_date}</td>
                    <td className="px-4 py-3 font-medium text-[#0F2942]">{p.students?.full_name ?? '-'}</td>
                    <td className="px-4 py-3 text-[#0F2942]/70">{p.students?.classes?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#0F2942]">{p.invoices?.invoice_number ?? '-'}</td>
                    <td className="px-4 py-3 text-[#0F2942]/70">{`${p.invoices?.term ?? '-'} / ${p.invoices?.academic_year ?? '-'}`}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 capitalize text-[#0F2942]">
                        {methodIcon(p.payment_method)} {p.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#0F2942]/70">{p.payment_reference ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">Rs. {Number(p.amount).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}
      </div>
    </div>
  );
}

export { ManagePayments };
