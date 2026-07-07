'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Mark, Attendance, ExamTerm, Subject, TimetableEntry, SchoolClass, Invoice } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateFeedback, SubjectMark } from '@/lib/ai-feedback';
import {
  BookOpen, CalendarDays, ClipboardCheck, TrendingUp, Award, Loader2, Sparkles, GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentDashboardProps {
  section: string;
}

export function StudentDashboard({ section }: StudentDashboardProps) {
  if (section === 'overview') return <StudentOverview />;
  if (section === 'my-marks') return <MyMarks />;
  if (section === 'my-attendance') return <MyAttendance />;
  if (section === 'my-timetable') return <MyTimetable />;
  if (section === 'my-fees') return <MyFees />;
  return <StudentOverview />;
}

function useStudentRecord() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('students')
        .select('*, classes(name, grade, section, academic_year)')
        .eq('user_id', user.id)
        .maybeSingle();
      setStudent(data);
      setLoading(false);
    })();
  }, [user]);

  return { student, loading };
}

function StudentOverview() {
  const { student, loading } = useStudentRecord();
  const [stats, setStats] = useState({ subjects: 0, attendance: 0, pendingFees: 0 });
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);
  const [latestTerm, setLatestTerm] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!student) return;
      const { count: subjCount } = await supabase.from('class_subjects').select('id', { count: 'exact', head: true }).eq('class_id', student.class_id);
      const { data: att } = await supabase.from('attendance').select('status').eq('student_id', student.id);
      const present = (att ?? []).filter((a: any) => a.status === 'present').length;
      const total = (att ?? []).length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      const { data: inv } = await supabase.from('invoices').select('total_amount, amount_paid').eq('student_id', student.id);
      const pending = (inv ?? []).reduce((s: number, i: any) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);
      setStats({ subjects: subjCount ?? 0, attendance: pct, pendingFees: pending });

      // Today's timetable
      const today = new Date().getDay();
      const { data: tt } = await supabase
        .from('timetable')
        .select('*, subjects(name, code), profiles(full_name)')
        .eq('class_id', student.class_id)
        .eq('day_of_week', today)
        .order('period');
      setTodayTimetable(tt ?? []);

      // Latest published marks for most recent term
      const { data: terms } = await supabase.from('exam_terms').select('*').order('sort_order', { ascending: false });
      if (terms && terms.length > 0) {
        const { data: marks } = await supabase
          .from('marks')
          .select('*, subjects(name)')
          .eq('student_id', student.id)
          .eq('exam_term_id', terms[0].id)
          .eq('published', true);
        if (marks && marks.length > 0) {
          const subjectMarks = marks.map((m: any) => ({
            subjectName: m.subjects?.name ?? 'Subject',
            marksObtained: Number(m.marks_obtained),
            maxMarks: Number(m.max_marks),
          }));
          const fb = generateFeedback(subjectMarks);
          setLatestTerm({ termName: terms[0].name, feedback: fb, count: marks.length });
        }
      }
    })();
  }, [student]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (!student) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No student record linked to your account. Contact the administrator.</div>;

  const cards = [
    { label: 'My Class', value: student.classes?.name ?? '-', icon: GraduationCap, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Subjects', value: stats.subjects, icon: BookOpen, color: 'from-green-500 to-green-600' },
    { label: 'Attendance', value: `${stats.attendance}%`, icon: ClipboardCheck, color: 'from-lime-500 to-lime-600' },
    { label: 'Pending Fees', value: `Rs. ${stats.pendingFees.toFixed(0)}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
  ];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F2942] flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-[#D95D16]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0F2942]">{student.full_name}</h2>
            <p className="text-sm text-[#0F2942]/60">{student.classes?.name} | Admission #{student.admission_number ?? 'N/A'}</p>
          </div>
        </div>
      </div>
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

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's Timetable */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Today&apos;s Schedule - {todayName}</h3>
          </div>
          {todayTimetable.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-[#0F2942]/50">No classes scheduled for today.</p>
              <p className="text-xs text-[#0F2942]/40 mt-1">Enjoy your day!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTimetable.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/40 border border-[#E5E7EB]/30">
                  <div className="w-10 h-10 rounded-lg bg-[#0F2942] flex items-center justify-center text-white text-xs font-bold">
                    P{e.period}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F2942] truncate">{e.subjects?.name ?? 'Free Period'}</p>
                    <p className="text-xs text-[#0F2942]/60">{e.start_time} - {e.end_time}</p>
                  </div>
                  {e.room && <span className="text-xs text-[#0F2942]/50">Room {e.room}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Performance */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Latest Performance</h3>
          </div>
          {!latestTerm ? (
            <p className="text-xs text-[#0F2942]/50 text-center py-6">No published marks yet.</p>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[#0F2942] text-white">{latestTerm.termName}</Badge>
                <Badge className="bg-[#D95D16] text-white">{latestTerm.feedback.grade}</Badge>
                <span className="text-sm font-bold text-[#0F2942]">{latestTerm.feedback.overallPercentage.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-[#0F2942]/70 mb-2">{latestTerm.feedback.summary}</p>
              {latestTerm.feedback.strengths.length > 0 && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 mb-1">
                  <p className="text-xs text-emerald-700">{latestTerm.feedback.strengths.join(' | ')}</p>
                </div>
              )}
              {latestTerm.feedback.weaknesses.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700">{latestTerm.feedback.weaknesses.join(' | ')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MyMarks() {
  const { student, loading } = useStudentRecord();
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [marks, setMarks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [feedback, setFeedback] = useState<any>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    supabase.from('exam_terms').select('*').order('sort_order').then(({ data }) => {
      setTerms((data as ExamTerm[]) ?? []);
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!student || !selectedTerm) return;
      const { data } = await supabase
        .from('marks')
        .select('*, subjects(name, code, max_marks)')
        .eq('student_id', student.id)
        .eq('exam_term_id', selectedTerm)
        .eq('published', true)
        .order('created_at');
      setMarks(data ?? []);
      const subMap: Record<string, Subject> = {};
      (data ?? []).forEach((m: any) => { if (m.subjects) subMap[m.subject_id] = m.subjects; });
      setSubjects(subMap);

      // Compute feedback
      const subjectMarks: SubjectMark[] = (data ?? []).map((m: any) => ({
        subjectName: m.subjects?.name ?? 'Subject',
        marksObtained: Number(m.marks_obtained),
        maxMarks: Number(m.max_marks),
      }));
      setFeedback(generateFeedback(subjectMarks));

      // Compute rank
      const term = terms.find((t) => t.id === selectedTerm);
      if (term) {
        const { data: allMarks } = await supabase
          .from('marks')
          .select('student_id, marks_obtained')
          .eq('class_id', student.class_id)
          .eq('exam_term_id', selectedTerm)
          .eq('academic_year', student.classes?.academic_year ?? '2025-2026')
          .eq('published', true);
        const totalsMap: Record<string, number> = {};
        (allMarks ?? []).forEach((m: any) => {
          totalsMap[m.student_id] = (totalsMap[m.student_id] ?? 0) + Number(m.marks_obtained);
        });
        const myTotal = totalsMap[student.id] ?? 0;
        const allTotals = Object.values(totalsMap);
        const sorted = [...allTotals].sort((a, b) => b - a);
        setRank(sorted.indexOf(myTotal) + 1);
        setTotalStudents(allTotals.length);
      }
    })();
  }, [student, selectedTerm, terms]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (!student) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No student record.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
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

      {feedback && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942]">AI Performance Feedback</h3>
          </div>
          <div className="grid sm:grid-cols-4 gap-3 mb-3">
            <div className="p-3 rounded-xl bg-[#0F2942] text-white">
              <p className="text-xs opacity-70">Overall</p>
              <p className="text-2xl font-bold">{feedback.overallPercentage.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-[#D95D16] text-white">
              <p className="text-xs opacity-90">Grade</p>
              <p className="text-2xl font-bold">{feedback.grade}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
              <p className="text-xs text-[#0F2942]/60">Class Rank</p>
              <p className="text-2xl font-bold text-[#0F2942]">{rank ?? '-'}/{totalStudents || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
              <p className="text-xs text-[#0F2942]/60">Subjects</p>
              <p className="text-2xl font-bold text-[#0F2942]">{marks.length}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40">
            <p className="text-sm font-semibold text-[#0F2942] mb-1">Summary</p>
            <p className="text-sm text-[#0F2942]/80">{feedback.summary}</p>
            <p className="text-sm text-[#0F2942]/80 mt-1">{feedback.recommendation}</p>
          </div>
          {feedback.strengths.length > 0 && (
            <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-800 mb-1">Strengths</p>
              <p className="text-xs text-emerald-700">{feedback.strengths.join(' | ')}</p>
            </div>
          )}
          {feedback.weaknesses.length > 0 && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-1">Areas to Improve</p>
              <p className="text-xs text-amber-700">{feedback.weaknesses.join(' | ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        {!selectedTerm ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">Select an exam term to view marks.</div>
        ) : marks.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No published marks for this term yet.</div>
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
                      <td className="px-4 py-3 text-right font-semibold text-[#0F2942]">{Number(m.marks_obtained).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-[#0F2942]/70">{m.max_marks}</td>
                      <td className="px-4 py-3 text-right text-[#0F2942]">{pct.toFixed(1)}%</td>
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

function MyAttendance() {
  const { student, loading } = useStudentRecord();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });

  useEffect(() => {
    (async () => {
      if (!student) return;
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)
        .order('date', { ascending: false });
      const recs = (data as Attendance[]) ?? [];
      setRecords(recs);
      const s = { present: 0, absent: 0, late: 0, excused: 0, total: recs.length };
      recs.forEach((r) => { (s as any)[r.status]++; });
      setStats(s);
    })();
  }, [student]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (!student) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No student record.</div>;

  const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="stat-card">
          <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
          <p className="text-xs text-[#0F2942]/60">Present</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          <p className="text-xs text-[#0F2942]/60">Absent</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
          <p className="text-xs text-[#0F2942]/60">Late</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
          <p className="text-xs text-[#0F2942]/60">Excused</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#0F2942]">{pct}%</p>
          <p className="text-xs text-[#0F2942]/60">Attendance</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No attendance records yet.</div>
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

function MyTimetable() {
  const { student, loading } = useStudentRecord();
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!student) return;
      const { data } = await supabase
        .from('timetable')
        .select('*, subjects(name, code), profiles(full_name)')
        .eq('class_id', student.class_id)
        .order('day_of_week')
        .order('period');
      setEntries(data ?? []);
    })();
  }, [student]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (!student) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No student record.</div>;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grid: Record<number, any[]> = {};
  entries.forEach((e) => {
    if (!grid[e.day_of_week]) grid[e.day_of_week] = [];
    grid[e.day_of_week].push(e);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0F2942]">Weekly Timetable - {student.classes?.name}</h2>
      {entries.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-[#0F2942]/60">
          No timetable has been published for your class yet.
        </div>
      ) : (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((day) => {
            const dayEntries = grid[day] ?? [];
            if (dayEntries.length === 0) return null;
            return (
              <div key={day} className="glass-card rounded-2xl p-4">
                <h3 className="font-bold text-[#0F2942] mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#D95D16]" /> {days[day]}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {dayEntries.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#0F2942]">Period {e.period}</span>
                        <span className="text-xs text-[#0F2942]/60">{e.start_time} - {e.end_time}</span>
                      </div>
                      <p className="font-semibold text-[#0F2942] text-sm">{e.subjects?.name ?? 'Free'}</p>
                      <p className="text-xs text-[#0F2942]/60">{e.profiles?.full_name ?? ''}</p>
                      {e.room && <p className="text-xs text-[#0F2942]/50">Room: {e.room}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyFees() {
  const { student, loading } = useStudentRecord();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!student) return;
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      setInvoices(data ?? []);
    })();
  }, [student]);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>;
  if (!student) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-[#0F2942]/60">No student record.</div>;

  const totalDue = invoices.reduce((s, i) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#0F2942]/60">Total Pending Dues</p>
            <p className="text-3xl font-bold text-red-600">Rs. {totalDue.toFixed(0)}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-red-500/30" />
        </div>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No invoices. You are all caught up!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-4 py-3">Invoice #</th>
                  <th className="text-left px-4 py-3">Term</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-right px-4 py-3">Paid</th>
                  <th className="text-right px-4 py-3">Balance</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const bal = Number(inv.total_amount) - Number(inv.amount_paid);
                  return (
                    <tr key={inv.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-[#0F2942]/70">{inv.term}</td>
                      <td className="px-4 py-3 text-right font-semibold">{Number(inv.total_amount).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{Number(inv.amount_paid).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-red-700 font-semibold">{bal.toFixed(0)}</td>
                      <td className="px-4 py-3">
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
    </div>
  );
}
