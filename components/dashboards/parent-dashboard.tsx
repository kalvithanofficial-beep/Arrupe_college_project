'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Student, ExamTerm, Mark, Attendance, Invoice, Notice } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Users, BookOpen, ClipboardCheck, TrendingUp, Sparkles, Award, GraduationCap, AlertTriangle } from 'lucide-react';
import { generateFeedback, SubjectMark } from '@/lib/ai-feedback';
import { cn } from '@/lib/utils';

interface ParentDashboardProps {
  section: string;
}

export function ParentDashboard({ section }: ParentDashboardProps) {
  if (section === 'overview') return <ParentOverview />;
  if (section === 'my-marks') return <ChildrenMarks />;
  if (section === 'my-attendance') return <ChildrenAttendance />;
  if (section === 'my-fees') return <ChildrenFees />;
  if (section === 'my-timetable') return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">Timetable view is available per child. Contact the school office for a printed copy.</div>;
  return <ParentOverview />;
}

function useChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('students')
        .select('*, classes(name, grade, section, academic_year)')
        .eq('parent_id', user.id);
      setChildren(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return { children, loading };
}

function ParentOverview() {
  const { children, loading } = useChildren();
  const [aggregate, setAggregate] = useState({ totalDues: 0, avgAttendance: 0, totalSubjects: 0, activeAlerts: 0 });

  useEffect(() => {
    (async () => {
      if (children.length === 0) return;
      let totalDues = 0;
      let totalAttendance = 0;
      let totalSubjects = 0;
      let activeAlerts = 0;

      for (const c of children) {
        const { data: inv } = await supabase.from('invoices').select('total_amount, amount_paid').eq('student_id', c.id);
        totalDues += (inv ?? []).reduce((s: number, i: any) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);

        const { data: att } = await supabase.from('attendance').select('status').eq('student_id', c.id);
        const present = (att ?? []).filter((a: any) => a.status === 'present').length;
        const total = (att ?? []).length;
        if (total > 0) totalAttendance += Math.round((present / total) * 100);

        const { count: subjCount } = await supabase.from('class_subjects').select('id', { count: 'exact', head: true }).eq('class_id', c.class_id);
        totalSubjects += subjCount ?? 0;

        const { count: alertCount } = await supabase.from('attendance_alerts').select('id', { count: 'exact', head: true }).eq('student_id', c.id).eq('is_dismissed', false);
        activeAlerts += alertCount ?? 0;
      }

      setAggregate({
        totalDues,
        avgAttendance: children.length > 0 ? Math.round(totalAttendance / children.length) : 0,
        totalSubjects,
        activeAlerts,
      });
    })();
  }, [children]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;

  const cards = [
    { label: 'Children', value: children.length, icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Total Subjects', value: aggregate.totalSubjects, icon: BookOpen, color: 'from-green-500 to-green-600' },
    { label: 'Avg Attendance', value: `${aggregate.avgAttendance}%`, icon: ClipboardCheck, color: 'from-lime-500 to-lime-600' },
    { label: 'Total Dues', value: `Rs. ${aggregate.totalDues.toFixed(0)}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F2942] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#D95D16]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0F2942]">Parent Portal</h2>
            <p className="text-sm text-[#0F2942]/60">Tracking {children.length} {children.length === 1 ? 'child' : 'children'}</p>
          </div>
        </div>
      </div>

      {aggregate.activeAlerts > 0 && (
        <div className="critical-banner flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-critical-pulse" />
          <p className="text-sm font-semibold">
            {aggregate.activeAlerts} critical attendance alert{aggregate.activeAlerts > 1 ? 's' : ''} active for your children. Check the banner above for details.
          </p>
        </div>
      )}

      {children.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">
          No children are linked to your account. Contact the school administrator.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="stat-card">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', c.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xl font-bold text-[#0F2942] truncate">{c.value}</p>
                  <p className="text-xs text-[#0F2942]/60 font-medium">{c.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {children.map((c) => (
              <ChildCard key={c.id} child={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChildCard({ child }: { child: any }) {
  const [stats, setStats] = useState({ attendance: 0, pendingFees: 0, subjects: 0 });
  const [latestFeedback, setLatestFeedback] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: att } = await supabase.from('attendance').select('status').eq('student_id', child.id);
      const present = (att ?? []).filter((a: any) => a.status === 'present').length;
      const total = (att ?? []).length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;

      const { data: inv } = await supabase.from('invoices').select('total_amount, amount_paid').eq('student_id', child.id);
      const pending = (inv ?? []).reduce((s: number, i: any) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);

      const { count: subjCount } = await supabase.from('class_subjects').select('id', { count: 'exact', head: true }).eq('class_id', child.class_id);

      // Latest published marks feedback
      const { data: terms } = await supabase.from('exam_terms').select('*').order('sort_order', { ascending: false });
      if (terms && terms.length > 0) {
        const { data: marks } = await supabase
          .from('marks')
          .select('*, subjects(name)')
          .eq('student_id', child.id)
          .eq('exam_term_id', terms[0].id)
          .eq('published', true);
        if (marks && marks.length > 0) {
          const subjectMarks: SubjectMark[] = marks.map((m: any) => ({
            subjectName: m.subjects?.name ?? 'Subject',
            marksObtained: Number(m.marks_obtained),
            maxMarks: Number(m.max_marks),
          }));
          setLatestFeedback(generateFeedback(subjectMarks));
        }
      }

      setStats({ attendance: pct, pendingFees: pending, subjects: subjCount ?? 0 });
    })();
  }, [child]);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#D95D16] flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#0F2942]">{child.full_name}</h3>
          <p className="text-xs text-[#0F2942]/60">{child.classes?.name} | Adm #{child.admission_number ?? 'N/A'}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-[#FAF8F3] text-center">
          <p className="text-lg font-bold text-[#0F2942]">{stats.subjects}</p>
          <p className="text-xs text-[#0F2942]/60">Subjects</p>
        </div>
        <div className="p-2 rounded-lg bg-[#FAF8F3] text-center">
          <p className="text-lg font-bold text-emerald-700">{stats.attendance}%</p>
          <p className="text-xs text-[#0F2942]/60">Attendance</p>
        </div>
        <div className="p-2 rounded-lg bg-[#FAF8F3] text-center">
          <p className="text-lg font-bold text-red-600">{stats.pendingFees.toFixed(0)}</p>
          <p className="text-xs text-[#0F2942]/60">Dues (Rs.)</p>
        </div>
      </div>
      {latestFeedback && (
        <div className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D95D16]" />
            <p className="text-xs font-semibold text-[#0F2942]">Latest Performance</p>
            <Badge className="ml-auto bg-[#D95D16] text-white text-xs">{latestFeedback.grade}</Badge>
          </div>
          <p className="text-xs text-[#0F2942]/70">{latestFeedback.summary}</p>
        </div>
      )}
    </div>
  );
}

function ChildrenMarks() {
  const { children, loading } = useChildren();
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [marks, setMarks] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    supabase.from('exam_terms').select('*').order('sort_order').then(({ data }) => {
      setTerms((data as ExamTerm[]) ?? []);
    });
  }, []);

  useEffect(() => {
    if (children.length > 0 && !selectedChild) setSelectedChild(children[0].id);
  }, [children]);

  useEffect(() => {
    (async () => {
      if (!selectedChild || !selectedTerm) return;
      const { data } = await supabase
        .from('marks')
        .select('*, subjects(name, code, max_marks)')
        .eq('student_id', selectedChild)
        .eq('exam_term_id', selectedTerm)
        .eq('published', true);
      setMarks(data ?? []);
      const subjectMarks: SubjectMark[] = (data ?? []).map((m: any) => ({
        subjectName: m.subjects?.name ?? 'Subject',
        marksObtained: Number(m.marks_obtained),
        maxMarks: Number(m.max_marks),
      }));
      setFeedback(generateFeedback(subjectMarks));
    })();
  }, [selectedChild, selectedTerm]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (children.length === 0) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No children linked.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Child</Label>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select child" /></SelectTrigger>
            <SelectContent>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Exam Term</Label>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select term" /></SelectTrigger>
            <SelectContent>
              {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {feedback && marks.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942]">AI Performance Feedback</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <div className="p-3 rounded-xl bg-[#0F2942] text-white">
              <p className="text-xs opacity-70">Overall</p>
              <p className="text-2xl font-bold">{feedback.overallPercentage.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-[#D95D16] text-white">
              <p className="text-xs opacity-90">Grade</p>
              <p className="text-2xl font-bold">{feedback.grade}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
              <p className="text-xs text-[#0F2942]/60">Subjects</p>
              <p className="text-2xl font-bold text-[#0F2942]">{marks.length}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40">
            <p className="text-sm text-[#0F2942]/80">{feedback.summary}</p>
            <p className="text-sm text-[#0F2942]/80 mt-1">{feedback.recommendation}</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        {!selectedTerm ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">Select a term to view marks.</div>
        ) : marks.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No published marks for this term.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-right px-4 py-3">Marks</th>
                  <th className="text-right px-4 py-3">Max</th>
                  <th className="text-right px-4 py-3">%</th>
                  <th className="text-left px-4 py-3">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => {
                  const pct = (Number(m.marks_obtained) / Number(m.max_marks)) * 100;
                  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
                  return (
                    <tr key={m.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                      <td className="px-4 py-3 font-medium text-[#0F2942]">{m.subjects?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{Number(m.marks_obtained).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-[#0F2942]/70">{m.max_marks}</td>
                      <td className="px-4 py-3 text-right">{pct.toFixed(1)}%</td>
                      <td className="px-4 py-3"><Badge className="bg-[#D95D16]/15 text-[#0F2942] border-[#D95D16]/30">{grade}</Badge></td>
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

function ChildrenAttendance() {
  const { children, loading } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [records, setRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (children.length > 0 && !selectedChild) setSelectedChild(children[0].id);
  }, [children]);

  useEffect(() => {
    (async () => {
      if (!selectedChild) return;
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedChild)
        .order('date', { ascending: false });
      setRecords((data as Attendance[]) ?? []);
    })();
  }, [selectedChild]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (children.length === 0) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No children linked.</div>;

  const present = records.filter((r) => r.status === 'present').length;
  const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <Label>Child</Label>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select child" /></SelectTrigger>
            <SelectContent>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
          <p className="text-xs text-[#0F2942]/60">Attendance Rate</p>
          <p className="text-xl font-bold text-emerald-700">{pct}%</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No attendance records.</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="table-head sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Day</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                    <td className="px-4 py-3 font-medium text-[#0F2942]">{r.date}</td>
                    <td className="px-4 py-3 text-[#0F2942]/70">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td className="px-4 py-3">
                      <Badge className={r.status === 'present' ? 'badge-present' : r.status === 'absent' ? 'badge-absent' : r.status === 'late' ? 'badge-late' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ChildrenFees() {
  const { children, loading } = useChildren();
  const [allInvoices, setAllInvoices] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const map: Record<string, any[]> = {};
      for (const c of children) {
        const { data } = await supabase.from('invoices').select('*').eq('student_id', c.id).order('created_at', { ascending: false });
        map[c.id] = data ?? [];
      }
      setAllInvoices(map);
    })();
  }, [children]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (children.length === 0) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No children linked.</div>;

  return (
    <div className="space-y-4">
      {children.map((c) => {
        const invs = allInvoices[c.id] ?? [];
        const totalDue = invs.reduce((s, i) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);
        return (
          <div key={c.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[#0F2942]">{c.full_name}</h3>
                <p className="text-xs text-[#0F2942]/60">{c.classes?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#0F2942]/60">Pending Dues</p>
                <p className="text-xl font-bold text-red-600">Rs. {totalDue.toFixed(0)}</p>
              </div>
            </div>
            {invs.length === 0 ? (
              <p className="text-sm text-[#0F2942]/60 text-center py-3">No invoices. All caught up!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-head">
                    <tr>
                      <th className="text-left px-3 py-2">Invoice #</th>
                      <th className="text-left px-3 py-2">Term</th>
                      <th className="text-right px-3 py-2">Total</th>
                      <th className="text-right px-3 py-2">Paid</th>
                      <th className="text-right px-3 py-2">Balance</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invs.map((inv) => {
                      const bal = Number(inv.total_amount) - Number(inv.amount_paid);
                      return (
                        <tr key={inv.id} className="border-t border-[#E5E7EB]/40">
                          <td className="px-3 py-2 font-mono text-xs">{inv.invoice_number}</td>
                          <td className="px-3 py-2 text-[#0F2942]/70">{inv.term}</td>
                          <td className="px-3 py-2 text-right font-semibold">{Number(inv.total_amount).toFixed(0)}</td>
                          <td className="px-3 py-2 text-right text-emerald-700">{Number(inv.amount_paid).toFixed(0)}</td>
                          <td className="px-3 py-2 text-right text-red-700 font-semibold">{bal.toFixed(0)}</td>
                          <td className="px-3 py-2">
                            <Badge className={inv.status === 'paid' ? 'badge-paid' : inv.status === 'partial' ? 'badge-partial' : 'badge-unpaid'}>
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
