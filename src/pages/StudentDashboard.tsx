import { useEffect, useState } from 'react';
import { AlertTriangle, Flame, Download, TrendingUp, Calendar, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Mark, TimetableEntry, Notice } from '../types';

const BAR_DATA = [65, 70, 58, 80, 72, 75, 68, 85, 78, 90, 96, 82];

const SCHEDULE_TODAY = [
  { time: '09:00 AM', subject: 'Physics Lab', room: 'Block C', teacher: 'Dr. Aris', active: true, mandatory: false },
  { time: '11:30 AM', subject: 'Discrete Math', room: 'Main Hall', teacher: 'Prof. Sen', active: false, mandatory: false },
  { time: '02:00 PM', subject: 'Mandatory Lab Session', room: 'Block C', teacher: 'Dr. Aris', active: false, mandatory: true },
];

export default function StudentDashboard() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const today = new Date().getDay();
    Promise.all([
      supabase.from('marks').select('*').eq('student_name', 'Aarav Sharma'),
      supabase.from('timetable_entries').select('*').eq('day_of_week', today === 0 ? 1 : today).order('start_time'),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
    ]).then(([{ data: m }, { data: tt }, { data: n }]) => {
      if (m) setMarks(m as Mark[]);
      if (tt) setTimetable(tt as TimetableEntry[]);
      if (n) setNotices(n as Notice[]);
    });
  }, []);

  const displayMarks = marks.length > 0 ? marks : [
    { id: '1', student_id: null, student_name: 'Aarav Sharma', subject: 'Advanced Physics', midterm: 88, finals: 92, internal: 10, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '2', student_id: null, student_name: 'Aarav Sharma', subject: 'Computer Architecture', midterm: 94, finals: 91, internal: 9, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '3', student_id: null, student_name: 'Aarav Sharma', subject: 'Discrete Mathematics', midterm: 76, finals: 82, internal: 10, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '4', student_id: null, student_name: 'Aarav Sharma', subject: 'English Communications', midterm: 85, finals: 88, internal: 8, max_score: 200, academic_year: '2023-24', created_at: '' },
  ];

  const totalScore = displayMarks.reduce((a, m) => a + m.midterm + m.finals + m.internal, 0);
  const totalMax = displayMarks.reduce((a, m) => a + m.max_score, 0);
  const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Alert */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-amber-800">
          <span className="font-bold">CRITICAL:</span> Mandatory Attendance required for Lab Practical Session today at 2:00 PM. (Sent via WhatsApp/SMS)
        </div>
        <button className="text-xs font-semibold text-amber-700 border border-amber-300 rounded px-3 py-1.5 hover:bg-amber-100 transition-colors shrink-0">
          View Details
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-accent-500">96%</div>
          <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">Attendance</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-navy-900">{avgPct}%</div>
          <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">Avg Score</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-emerald-600">#12</div>
          <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">Global Rank</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-blue-600">24</div>
          <div className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">Day Streak</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Academic Performance table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-navy-900">Academic Performance</h2>
                <p className="text-slate-400 text-xs mt-0.5">Historical marksheet tracker for 2023-24 &nbsp;|&nbsp; <span className="font-semibold text-navy-900">Global Rank #12</span></p>
              </div>
              <button className="flex items-center gap-1.5 bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors">
                <Download size={13} />
                Download
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wide text-left">
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-5 py-3 text-right">Midterm</th>
                    <th className="px-5 py-3 text-right">Finals</th>
                    <th className="px-5 py-3 text-right">Internal</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayMarks.map(m => {
                    const total = m.midterm + m.finals + m.internal;
                    const pct = Math.round((total / m.max_score) * 100);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-navy-900 text-sm">{m.subject}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.midterm}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.finals}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.internal}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-accent-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold text-navy-900 w-16 text-right">{total}/{m.max_score}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Academic Year 2023-24</span>
              <span className="font-bold text-navy-900">
                Total: {totalScore}/{totalMax} &nbsp;({avgPct}%)
              </span>
            </div>
          </div>

          {/* Bottom row: Attendance Streak + Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Streak */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={18} className="text-accent-500" />
                <h2 className="font-bold text-navy-900">Attendance Streak</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">24 days of consistent learning</p>
              <div className="flex items-end gap-1 h-20 mb-3">
                {BAR_DATA.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all"
                    style={{ height: `${h}%`, background: i === 10 ? '#e07b39' : i === BAR_DATA.length - 1 ? '#93c5fd' : '#e2e8f0' }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-accent-500 font-bold text-xl">96% Overall</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Goal: 95% ✓
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy-900">Today's Schedule</h2>
                <span className="badge bg-emerald-100 text-emerald-700">Active</span>
              </div>
              <div className="space-y-3">
                {SCHEDULE_TODAY.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 pl-3 border-l-4 transition-colors ${item.active ? 'border-accent-500' : 'border-slate-200'}`}>
                    <div className="min-w-[52px]">
                      <div className="text-xs font-bold text-navy-900">{item.time.split(' ')[0]}</div>
                      <div className="text-xs text-slate-400">{item.time.split(' ')[1]}</div>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${item.mandatory ? 'text-red-600' : 'text-navy-900'}`}>{item.subject}</div>
                      <div className="text-xs text-slate-400">{item.room} &bull; {item.teacher}</div>
                      {item.mandatory && <div className="text-xs text-red-400 mt-0.5">Required for finals</div>}
                    </div>
                  </div>
                ))}
                {timetable.slice(0, 2).map(t => (
                  <div key={t.id} className="flex items-start gap-3 pl-3 border-l-4 border-slate-100">
                    <div className="min-w-[52px]">
                      <div className="text-xs font-bold text-navy-900">{formatTime(t.start_time)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-navy-900">{t.subject}</div>
                      <div className="text-xs text-slate-400">{t.room} {t.teacher_name ? `• ${t.teacher_name}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Subject overview + Notices */}
        <div className="space-y-5">
          {/* Subject Progress */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-accent-500" />
              <h2 className="font-bold text-navy-900">Subject Progress</h2>
            </div>
            <div className="space-y-3">
              {[
                { subject: 'Advanced Physics', pct: 95, grade: 'A+' },
                { subject: 'Computer Architecture', pct: 97, grade: 'A+' },
                { subject: 'Discrete Math', pct: 84, grade: 'A' },
                { subject: 'English Comm.', pct: 90, grade: 'A+' },
              ].map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-navy-900">{s.subject}</span>
                    <span className="text-slate-500 font-semibold">{s.grade} &bull; {s.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${s.pct >= 90 ? 'bg-emerald-500' : 'bg-accent-500'}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-accent-500" />
              <h2 className="font-bold text-navy-900">Upcoming</h2>
            </div>
            <div className="space-y-3">
              {[
                { date: 'Oct 28', label: 'PTA Meeting', type: 'event', icon: <CheckCircle2 size={14} className="text-blue-500" /> },
                { date: 'Nov 5', label: 'Term 2 Exams Begin', type: 'exam', icon: <BookOpen size={14} className="text-accent-500" /> },
                { date: 'Nov 10', label: 'Diwali Break Starts', type: 'holiday', icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
                { date: 'Nov 15', label: 'Sports Day Trials', type: 'event', icon: <Clock size={14} className="text-violet-500" /> },
              ].map((ev, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-10 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center shrink-0">
                    <div className="text-xs font-bold text-navy-900 leading-tight">{ev.date.split(' ')[1]}</div>
                    <div className="text-xs text-slate-400">{ev.date.split(' ')[0]}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    {ev.icon}
                    <span className="text-sm text-navy-900">{ev.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest notices */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-3">Latest Notices</h2>
            <div className="space-y-2">
              {notices.map(n => (
                <div key={n.id} className="text-sm">
                  <div className="font-medium text-navy-900 leading-tight">{n.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{n.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
