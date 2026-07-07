'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Student, SchoolClass, Subject, ExamTerm, Mark, Attendance } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateFeedback, computeRank, SubjectMark } from '@/lib/ai-feedback';
import {
  ClipboardCheck, BookOpen, Loader2, Save, CheckCircle2, Sparkles, TrendingUp, Award, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeacherDashboardProps {
  section: string;
}

export function TeacherDashboard({ section }: TeacherDashboardProps) {
  if (section === 'overview') return <TeacherOverview />;
  if (section === 'attendance') return <AttendanceGrid />;
  if (section === 'marks') return <MarksEntry />;
  return <TeacherOverview />;
}

function TeacherOverview() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ classes: 0, subjects: 0, students: 0, attendanceToday: 0 });

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: cs } = await supabase.from('class_subjects').select('class_id, subject_id').eq('teacher_id', profile.id);
      const classIds = Array.from(new Set((cs ?? []).map((x: any) => x.class_id)));
      const subjectIds = Array.from(new Set((cs ?? []).map((x: any) => x.subject_id)));
      const { count: studentCount } = await supabase.from('students').select('id', { count: 'exact', head: true }).in('class_id', classIds);
      const today = new Date().toISOString().slice(0, 10);
      const { count: attCount } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).in('class_id', classIds);
      setStats({
        classes: classIds.length,
        subjects: subjectIds.length,
        students: studentCount ?? 0,
        attendanceToday: attCount ?? 0,
      });
    })();
  }, [profile]);

  const cards = [
    { label: 'My Classes', value: stats.classes, icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { label: 'My Subjects', value: stats.subjects, icon: BookOpen, color: 'from-green-500 to-green-600' },
    { label: 'My Students', value: stats.students, icon: ClipboardCheck, color: 'from-lime-500 to-lime-600' },
    { label: 'Attendance Today', value: stats.attendanceToday, icon: CheckCircle2, color: 'from-teal-500 to-teal-600' },
  ];

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
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-[#D95D16]" />
          <h3 className="font-bold text-[#0F2942]">Academic-Only Access</h3>
        </div>
        <p className="text-sm text-[#0F2942]/70 leading-relaxed">
          As a Teacher, you can enter manual grid attendance (no QR codes) for your assigned classes
          and upload marks dynamically across all exam terms. After publishing marks, totals and class
          ranks are computed instantly, and the AI engine generates constructive performance feedback
          for each student.
        </p>
      </div>
    </div>
  );
}

function AttendanceGrid() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: cs } = await supabase
        .from('class_subjects')
        .select('classes(id, name, grade, section)')
        .eq('teacher_id', profile.id);
      const cls = (cs ?? []).map((x: any) => x.classes).filter(Boolean);
      const unique = Array.from(new Map(cls.map((c: any) => [c.id, c])).values());
      setClasses(unique);
      if (unique.length > 0 && !selectedClass) setSelectedClass(unique[0].id);
      setLoading(false);
    })();
  }, [profile]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    const { data: studs } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .order('roll_number');
    setStudents((studs as Student[]) ?? []);

    const { data: existing } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('class_id', selectedClass)
      .eq('date', date);
    const map: Record<string, any> = {};
    (existing ?? []).forEach((a: any) => { map[a.student_id] = a.status; });
    setAttendance(map);
    setLoading(false);
  }, [selectedClass, date]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const setStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const map: Record<string, any> = {};
    students.forEach((s) => { map[s.id] = status; });
    setAttendance(map);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const rows = students.map((s) => ({
      student_id: s.id,
      class_id: selectedClass,
      date,
      status: attendance[s.id] ?? 'present',
      marked_by: profile.id,
    }));

    // Upsert: delete existing then insert
    await supabase.from('attendance').delete().eq('class_id', selectedClass).eq('date', date);
    const { error } = await supabase.from('attendance').insert(rows);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Attendance saved', description: `${rows.length} records for ${date}` });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button variant="outline" size="sm" onClick={() => markAll('present')} className="text-emerald-700">
          <CheckCircle2 className="w-4 h-4 mr-1" /> Mark All Present
        </Button>
        <Button onClick={save} disabled={saving || !selectedClass} className="btn-amber">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Attendance
        </Button>
      </div>

      {!loading && students.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-[#E5E7EB]/40">
          <span className="text-xs font-semibold text-[#0F2942]/60 uppercase tracking-wider">Live Summary:</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
            Present: {students.filter((s) => attendance[s.id] === 'present').length}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 font-medium">
            Absent: {students.filter((s) => attendance[s.id] === 'absent').length}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-medium">
            Late: {students.filter((s) => attendance[s.id] === 'late').length}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-medium">
            Excused: {students.filter((s) => attendance[s.id] === 'excused').length}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
            Unmarked: {students.filter((s) => !attendance[s.id]).length}
          </span>
          <span className="ml-auto text-xs text-[#0F2942]/50">
            {students.length} students total
          </span>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No students in this class.</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {students.map((s, idx) => {
              const current = attendance[s.id] || 'unmarked';
              const statusIcons: any = {
                present: '✓',
                absent: '✗',
                late: '⏱',
                excused: '📝',
                unmarked: '-',
              };

              return (
                <div key={s.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[#E5E7EB]/40 hover:bg-white/60 hover:border-[#D95D16]/30 transition-all group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#0F2942]/40 w-6 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F2942] truncate">{s.full_name}</p>
                      {s.roll_number && <p className="text-xs text-[#0F2942]/50">Roll: {s.roll_number}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Checkbox for Present */}
                    <button
                      onClick={() => setStatus(s.id, current === 'present' ? 'unmarked' : 'present')}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all"
                      style={{
                        borderColor: current === 'present' ? '#10b981' : '#e5e7eb',
                        backgroundColor: current === 'present' ? '#10b981' : 'white',
                      }}
                      title={`${s.full_name} - Mark as Present`}
                    >
                      {current === 'present' && <span className="text-white font-bold text-lg">✓</span>}
                    </button>

                    {/* Status quick buttons */}
                    <div className="flex gap-1">
                      {['absent', 'late', 'excused'].map((st) => {
                        const colorMap: any = {
                          absent: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
                          late: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
                          excused: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                        };
                        const isActive = current === st;
                        
                        return (
                          <button
                            key={st}
                            onClick={() => setStatus(s.id, isActive ? 'unmarked' : st as any)}
                            className={cn(
                              'px-2 py-1.5 rounded-lg text-xs font-bold border transition-all',
                              isActive 
                                ? colorMap[st].replace('hover:', '')
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            )}
                            title={`${s.full_name} - ${st.charAt(0).toUpperCase() + st.slice(1)}`}
                          >
                            {statusIcons[st]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MarksEntry() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [existingMarks, setExistingMarks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: cs } = await supabase
        .from('class_subjects')
        .select('classes(id, name), subjects(id, name, code, max_marks)')
        .eq('teacher_id', profile.id);
      const clsMap = new Map();
      const subMap = new Map();
      (cs ?? []).forEach((x: any) => {
        if (x.classes) clsMap.set(x.classes.id, x.classes);
        if (x.subjects) subMap.set(x.subjects.id, x.subjects);
      });
      setClasses(Array.from(clsMap.values()));
      setSubjects(Array.from(subMap.values()));
      const { data: t } = await supabase.from('exam_terms').select('*').order('sort_order');
      setTerms((t as ExamTerm[]) ?? []);
      if ((t as ExamTerm[])?.length && !selectedTerm) setSelectedTerm((t as ExamTerm[])[0].id);
      setLoading(false);
    })();
  }, [profile]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    const { data: studs } = await supabase.from('students').select('*').eq('class_id', selectedClass).order('roll_number');
    setAllStudents((studs as Student[]) ?? []);
    setSelectedStudents([]);
    setMarks({});
    setExistingMarks({});
    setFeedback(null);
    setSearchStudent('');

    if (selectedSubject && selectedTerm) {
      const { data: existing } = await supabase
        .from('marks')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .eq('exam_term_id', selectedTerm)
        .eq('academic_year', academicYear);
      const map: Record<string, any> = {};
      (existing ?? []).forEach((m: any) => { map[m.student_id] = m; });
      setExistingMarks(map);
      const fillMap: Record<string, string> = {};
      (existing ?? []).forEach((m: any) => { fillMap[m.student_id] = String(m.marks_obtained); });
      setMarks(fillMap);
    }
    setLoading(false);
  }, [selectedClass, selectedSubject, selectedTerm, academicYear]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const addStudent = (student: Student) => {
    if (!selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setSearchStudent('');
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };

  const filteredStudents = allStudents.filter(s => 
    !selectedStudents.find(ss => ss.id === s.id) &&
    (s.full_name.toLowerCase().includes(searchStudent.toLowerCase()) || 
     (s.roll_number && s.roll_number.toString().includes(searchStudent)))
  );

  const save = async (publish: boolean) => {
    if (!profile || !selectedClass || !selectedSubject || !selectedTerm) return;
    setSaving(true);
    const subject = subjects.find((s) => s.id === selectedSubject);
    const maxMarks = subject?.max_marks ?? 100;

    for (const s of selectedStudents) {
      const val = marks[s.id];
      if (val === undefined || val === '') continue;
      const numVal = Number(val);
      if (isNaN(numVal) || numVal < 0 || numVal > maxMarks) {
        toast({ title: `Invalid marks for ${s.full_name}`, variant: 'destructive' });
        setSaving(false);
        return;
      }
      const existing = existingMarks[s.id];
      if (existing) {
        await supabase.from('marks').update({
          marks_obtained: numVal,
          max_marks: maxMarks,
          published: publish || existing.published,
          entered_by: profile.id,
        }).eq('id', existing.id);
      } else {
        await supabase.from('marks').insert({
          student_id: s.id,
          subject_id: selectedSubject,
          exam_term_id: selectedTerm,
          academic_year: academicYear,
          class_id: selectedClass,
          marks_obtained: numVal,
          max_marks: maxMarks,
          published: publish,
          entered_by: profile.id,
        });
      }
    }

    if (publish) {
      const { data: allMarks } = await supabase
        .from('marks')
        .select('student_id, marks_obtained, max_marks')
        .eq('class_id', selectedClass)
        .eq('exam_term_id', selectedTerm)
        .eq('academic_year', academicYear)
        .eq('published', true);

      const totalsMap: Record<string, number> = {};
      (allMarks ?? []).forEach((m: any) => {
        totalsMap[m.student_id] = (totalsMap[m.student_id] ?? 0) + Number(m.marks_obtained);
      });
      const allTotals = Object.values(totalsMap);
      const ranksMap: Record<string, number> = {};
      Object.keys(totalsMap).forEach((sid) => {
        ranksMap[sid] = computeRank(totalsMap[sid], allTotals);
      });

      const { data: subjectList } = await supabase
        .from('marks')
        .select('student_id, marks_obtained, max_marks, subjects(name)')
        .eq('class_id', selectedClass)
        .eq('exam_term_id', selectedTerm)
        .eq('academic_year', academicYear)
        .eq('published', true);

      const byStudent: Record<string, SubjectMark[]> = {};
      (subjectList ?? []).forEach((m: any) => {
        if (!byStudent[m.student_id]) byStudent[m.student_id] = [];
        byStudent[m.student_id].push({
          subjectName: m.subjects?.name ?? 'Subject',
          marksObtained: Number(m.marks_obtained),
          maxMarks: Number(m.max_marks),
        });
      });

      const feedbackData: Record<string, any> = {};
      Object.keys(byStudent).forEach((sid) => {
        feedbackData[sid] = generateFeedback(byStudent[sid]);
        feedbackData[sid].rank = ranksMap[sid] ?? 0;
        feedbackData[sid].totalStudents = allTotals.length;
      });
      setFeedback(feedbackData);

      toast({
        title: 'Marks published',
        description: `Totals, ranks, and AI feedback computed for ${allTotals.length} students.`,
      });
    } else {
      toast({ title: 'Marks saved as draft' });
    }
    setSaving(false);
    loadStudents();
  };

  const subject = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Exam Term</Label>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Term" /></SelectTrigger>
            <SelectContent>
              {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Academic Year</Label>
          <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-32" />
        </div>
      </div>

      {subject && (
        <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40 text-sm text-[#0F2942]">
          <span className="font-semibold">{subject.name}</span> | Max marks: {subject.max_marks}
        </div>
      )}

      {/* Student Selection */}
      {!loading && allStudents.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <Label className="text-base font-semibold">Select Students to Enter Marks</Label>
          <div className="relative mt-2">
            <Input
              type="text"
              placeholder="Search student name or roll number..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full"
            />
            {searchStudent && filteredStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB]/40 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addStudent(s)}
                    className="w-full text-left px-4 py-2 hover:bg-[#FAF8F3] border-b border-[#E5E7EB]/20 last:border-b-0 transition-all"
                  >
                    <span className="font-medium text-[#0F2942]">{s.full_name}</span>
                    {s.roll_number && <span className="text-xs text-[#0F2942]/50 ml-2">(Roll: {s.roll_number})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Students List */}
          {selectedStudents.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-[#0F2942]">Selected Students ({selectedStudents.length})</p>
              {selectedStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/60 border border-[#E5E7EB]/40">
                  <div>
                    <p className="font-medium text-[#0F2942]">{s.full_name}</p>
                    {s.roll_number && <p className="text-xs text-[#0F2942]/50">Roll: {s.roll_number}</p>}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={subject?.max_marks ?? 100}
                    value={marks[s.id] ?? ''}
                    onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                    placeholder="Marks"
                    className="w-24 h-9"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeStudent(s.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedStudents.length > 0 && (
        <div className="flex gap-2">
          <Button onClick={() => save(false)} disabled={saving} variant="outline" className="border-[#D95D16] text-[#D95D16]">
            <Save className="w-4 h-4 mr-2" /> Save as Draft
          </Button>
          <Button onClick={() => save(true)} disabled={saving} className="btn-amber">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Publish & Compute Ranks
          </Button>
        </div>
      )}
    </div>
  );
}
