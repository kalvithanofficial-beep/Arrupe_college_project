import { useEffect, useState } from 'react';
import { Download, AlertTriangle, Flame, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Mark, TimetableEntry } from '../types';

const SCHEDULE = [
  { time: '09:00 AM', subject: 'Physics Lab', room: 'Block C', teacher: 'Dr. Aris', active: true, mandatory: false },
  { time: '11:30 AM', subject: 'Discrete Math', room: 'Main Hall', teacher: 'Prof. Sen', active: false, mandatory: false },
  { time: '02:00 PM', subject: 'Mandatory Lab Session', room: 'Block C', teacher: 'Dr. Aris', active: false, mandatory: true },
];

const BAR_DATA = [65, 70, 58, 80, 72, 75, 68, 85, 78, 90, 96, 82];

export default function StudentPerformance() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().getDay();
    Promise.all([
      supabase.from('marks').select('*').eq('student_name', 'Aarav Sharma'),
      supabase.from('timetable_entries').select('*').eq('day_of_week', today === 0 ? 1 : today).order('start_time'),
    ]).then(([{ data: m }, { data: tt }]) => {
      if (m) setMarks(m as Mark[]);
      if (tt) setTimetable(tt as TimetableEntry[]);
      setLoading(false);
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

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Alert */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 flex-1">
          <span className="font-bold">CRITICAL:</span> Mandatory Attendance required for Lab Practical Session today at 2:00 PM. (Sent via WhatsApp/SMS)
        </p>
        <button className="text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors shrink-0">
          View Details
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Marksheet */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-navy-900 text-lg">Academic Performance</h2>
                <p className="text-slate-500 text-xs mt-0.5">Historical marksheet tracker for 2023-24</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Global Rank</div>
                <div className="text-2xl font-black text-navy-900">#12</div>
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : (
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
                                <div className="bg-accent-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm font-bold text-navy-900">{total}/{m.max_score}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-5 py-3 text-sm text-navy-900">Total</td>
                      <td colSpan={3} />
                      <td className="px-5 py-3 text-right text-sm text-navy-900">{totalScore}/{totalMax}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <div className="p-5 border-t border-slate-100">
              <button className="flex items-center gap-2 btn-primary text-sm">
                <Download size={14} /> Download Report
              </button>
            </div>
          </div>

          {/* Attendance Streak + Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={18} className="text-accent-500" />
                <h2 className="font-bold text-navy-900">Attendance Streak</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">24 days of consistent learning</p>
              <div className="flex items-end gap-1 h-20 mb-3">
                {BAR_DATA.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 10 ? '#e07b39' : '#e2e8f0' }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-accent-500 font-bold text-xl">96% Overall</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Goal: 95%
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy-900">Today's Schedule</h2>
                <span className="badge bg-emerald-100 text-emerald-700">Active</span>
              </div>
              <div className="space-y-3">
                {SCHEDULE.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 pl-3 border-l-4 ${item.active ? 'border-accent-500' : 'border-slate-200'}`}>
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
                      <div className="text-xs text-slate-400">{t.room}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar panel */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Ready for Review?</h2>
            <p className="text-sm text-slate-500 mb-4">Generate your certified monthly grade report for the semester.</p>
            <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <Download size={14} /> Download Report
            </button>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-3 text-sm">Quick Stats</h2>
            <div className="space-y-2">
              {[
                { label: 'Subjects', value: String(displayMarks.length) },
                { label: 'Total Score', value: `${totalScore}/${totalMax}` },
                { label: 'Percentage', value: `${Math.round((totalScore / totalMax) * 100)}%` },
                { label: 'Attendance', value: '96%' },
                { label: 'Streak', value: '24 days' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className="text-sm font-bold text-navy-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
