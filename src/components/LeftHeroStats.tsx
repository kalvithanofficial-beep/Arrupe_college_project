import { useEffect, useState } from 'react';
// icons intentionally omitted to avoid unused-import errors
import { supabase } from '../lib/supabase';

export default function LeftHeroStats() {
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function fetchStats() {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [{ count: sc }, { count: tc }, { count: presentCount }, { count: totalCount }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('role', 'student'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('role', 'teacher'),
          supabase.from('attendance_records').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('date', today).eq('present', true),
          supabase.from('attendance_records').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('date', today),
        ]);

        if (!mounted || controller.signal.aborted) return;
        setStudentCount(sc ?? 0);
        setTeacherCount(tc ?? 0);
        const p = presentCount ?? 0;
        const t = totalCount ?? 0;
        setAttendanceRate(t > 0 ? Math.round((p / t) * 1000) / 10 : null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('LeftHeroStats fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStats();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const stats = [
    { label: 'Students', value: loading ? '...' : (studentCount ?? 0).toLocaleString() },
    { label: 'Teachers', value: loading ? '...' : (teacherCount ?? 0).toLocaleString() },
    { label: 'Attendance', value: loading ? '...' : (attendanceRate !== null ? `${attendanceRate}%` : '—') },
  ];

  return (
    <div className="relative z-10">
      <h1 className="text-4xl font-bold text-white leading-tight mb-4">
        Manage your school<br />
        <span className="text-accent-400">smarter, faster.</span>
      </h1>
      <p className="text-slate-400 text-lg leading-relaxed max-w-md">
        A unified portal for administrators, teachers, parents, and students.
        Track attendance, manage finances, and stay connected.
      </p>

      <div className="mt-10 grid grid-cols-3 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
