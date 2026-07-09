import { useEffect, useState } from 'react';
import { Download, TrendingUp, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Mark } from '../types';

const CHILDREN = [
  { name: 'Arun Kumar', class: 'Class XI-A', grade: 'A+', rank: 12 },
  { name: 'Priya Kumar', class: 'Class IX-A', grade: 'B+', rank: 28 },
];

const CHILD_MARKS: Record<string, Mark[]> = {
  'Arun Kumar': [
    { id: '1', student_id: null, student_name: 'Arun Kumar', subject: 'Advanced Physics', midterm: 88, finals: 92, internal: 10, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '2', student_id: null, student_name: 'Arun Kumar', subject: 'Computer Architecture', midterm: 94, finals: 91, internal: 9, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '3', student_id: null, student_name: 'Arun Kumar', subject: 'Discrete Mathematics', midterm: 76, finals: 82, internal: 10, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '4', student_id: null, student_name: 'Arun Kumar', subject: 'English Communications', midterm: 85, finals: 88, internal: 8, max_score: 200, academic_year: '2023-24', created_at: '' },
  ],
  'Priya Kumar': [
    { id: '5', student_id: null, student_name: 'Priya Kumar', subject: 'Mathematics', midterm: 72, finals: 78, internal: 8, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '6', student_id: null, student_name: 'Priya Kumar', subject: 'Science', midterm: 80, finals: 85, internal: 9, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '7', student_id: null, student_name: 'Priya Kumar', subject: 'English', midterm: 88, finals: 90, internal: 9, max_score: 200, academic_year: '2023-24', created_at: '' },
    { id: '8', student_id: null, student_name: 'Priya Kumar', subject: 'Social Studies', midterm: 65, finals: 70, internal: 7, max_score: 200, academic_year: '2023-24', created_at: '' },
  ],
};

export default function ParentAcademic() {
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [dbMarks, setDbMarks] = useState<Mark[]>([]);

  const child = CHILDREN[selectedChildIdx];
  const marks = dbMarks.length > 0 ? dbMarks : (CHILD_MARKS[child.name] ?? []);

  useEffect(() => {
    supabase.from('marks').select('*').eq('student_name', child.name).then(({ data }) => {
      if (data && data.length > 0) setDbMarks(data as Mark[]);
      else setDbMarks([]);
    });
  }, [child.name]);

  const total = marks.reduce((a, m) => a + m.midterm + m.finals + m.internal, 0);
  const maxTotal = marks.reduce((a, m) => a + m.max_score, 0);
  const avgPct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Academic Performance</h1>
          <p className="text-slate-500 text-sm mt-0.5">View your child's grades and marks</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowChildPicker(v => !v)}
            className="flex items-center gap-2 border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-50 transition-colors">
            {child.name}
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showChildPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowChildPicker(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {CHILDREN.map((c, i) => (
                  <button key={i} onClick={() => { setSelectedChildIdx(i); setShowChildPicker(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${selectedChildIdx === i ? 'text-accent-600 font-semibold' : 'text-slate-700'}`}>
                    <div>{c.name}</div><div className="text-xs text-slate-400">{c.class}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-accent-500">{child.grade}</div>
              <div className="text-xs text-slate-500 mt-0.5">Overall Grade</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-navy-900">{avgPct}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Avg Score</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-emerald-600">#{child.rank}</div>
              <div className="text-xs text-slate-500 mt-0.5">Class Rank</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-blue-600">{marks.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Subjects</div>
            </div>
          </div>

          {/* Marks table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-navy-900">Detailed Marksheet — 2023-24</h2>
              <button className="flex items-center gap-1.5 text-sm font-medium text-accent-600 border border-accent-200 px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors">
                <Download size={14} /> Download Report
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
                    <th className="px-5 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {marks.map(m => {
                    const total = m.midterm + m.finals + m.internal;
                    const pct = Math.round((total / m.max_score) * 100);
                    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-navy-900 text-sm">{m.subject}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.midterm}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.finals}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.internal}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 bg-slate-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-accent-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-bold text-navy-900">{total}/{m.max_score}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`badge ${pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI insights */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent-500" />
              <h2 className="font-bold text-navy-900 text-sm">AI Analysis</h2>
            </div>
            <div className={`p-3 rounded-xl mb-3 ${avgPct >= 85 ? 'bg-emerald-50 border border-emerald-100' : avgPct >= 70 ? 'bg-blue-50 border border-blue-100' : 'bg-amber-50 border border-amber-100'}`}>
              <div className={`text-xs font-bold uppercase mb-1 ${avgPct >= 85 ? 'text-emerald-700' : avgPct >= 70 ? 'text-blue-700' : 'text-amber-700'}`}>
                {avgPct >= 85 ? 'High Performer' : avgPct >= 70 ? 'Steady Progress' : 'Needs Focus'}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {avgPct >= 85
                  ? `${child.name} is performing exceptionally well. Consider advanced coursework or olympiad participation.`
                  : avgPct >= 70
                  ? `${child.name} shows steady improvement. Consistent effort is helping achieve good results.`
                  : `${child.name} needs additional support in some subjects. Tutoring sessions are recommended.`}
              </p>
            </div>
            <div className="space-y-2">
              {marks.map(m => {
                const pct = Math.round(((m.midterm + m.finals + m.internal) / m.max_score) * 100);
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-slate-600 truncate">{m.subject.split(' ')[0]}</span>
                      <span className="font-bold text-navy-900 shrink-0 ml-2">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-accent-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-accent-500" />
              <h2 className="font-bold text-navy-900 text-sm">Term Comparison</h2>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { term: 'Term 1', score: `${avgPct - 4}%`, trend: 'up' },
                { term: 'Term 2', score: `${avgPct}%`, trend: 'up' },
                { term: 'Target', score: '95%', trend: 'target' },
              ].map(t => (
                <div key={t.term} className="flex items-center justify-between">
                  <span className="text-slate-600">{t.term}</span>
                  <span className={`font-bold ${t.term === 'Target' ? 'text-accent-500' : 'text-navy-900'}`}>{t.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
