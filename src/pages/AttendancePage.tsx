import { useEffect, useState } from 'react';
import { CalendarCheck, TrendingUp, Users, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AttendanceRecord } from '../types';

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function loadRecords() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('attendance_records')
          .select('*')
          .abortSignal(controller.signal)
          .eq('date', selectedDate)
          .order('student_name');
        if (mounted && !controller.signal.aborted && data) setRecords(data as AttendanceRecord[]);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Attendance load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRecords();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [selectedDate]);

  const present = records.filter(r => r.present).length;
  const absent = records.filter(r => !r.present).length;
  const total = records.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Daily attendance records across all classes</p>
        </div>
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-slate-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">{total}</div>
              <div className="text-xs text-slate-500">Total Records</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-700">{present}</div>
              <div className="text-xs text-slate-500">Present</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={18} className="text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{absent}</div>
              <div className="text-xs text-slate-500">Absent</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-accent-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-accent-700">{pct}%</div>
              <div className="text-xs text-slate-500">Attendance Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <CalendarCheck size={18} className="text-accent-500" />
          <h2 className="font-bold text-navy-900">
            Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <CalendarCheck size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No attendance records for this date.</p>
            <p className="text-slate-400 text-xs mt-1">Submit attendance from the Academic Dashboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Section</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.present ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-semibold text-navy-900">{r.student_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{r.class_name}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-blue-100 text-blue-700">{r.section}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={r.present ? 'badge bg-emerald-100 text-emerald-700' : 'badge bg-red-100 text-red-600'}>
                        {r.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">
                      {new Date(r.date).toLocaleDateString()}
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
