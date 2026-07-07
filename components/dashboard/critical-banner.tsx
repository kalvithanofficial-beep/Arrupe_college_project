'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AttendanceAlert, Student } from '@/lib/types';
import { AlertTriangle, X, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

interface BannerData {
  alert: AttendanceAlert;
  studentName: string;
  className: string;
  subjectName: string;
  date: string;
  timeBlock: string;
}

export function CriticalBanner() {
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find student(s) linked to this user (either as the student themselves or as a parent)
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, class_id, user_id, parent_id')
        .or(`user_id.eq.${user.id},parent_id.eq.${user.id}`)
        .returns<Student[]>();

      if (!students || students.length === 0) return;

      const studentIds = students.map((s) => s.id);
      const studentMap = new Map(students.map((s) => [s.id, s]));

      const { data: alerts } = await supabase
        .from('attendance_alerts')
        .select('*')
        .in('student_id', studentIds)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .returns<AttendanceAlert[]>();

      if (!alerts || alerts.length === 0) return;

      // Fetch substitution + class + subject details
      const subIds = Array.from(new Set(alerts.map((a) => a.substitution_id)));
      const { data: subs } = await supabase
        .from('substitutions')
        .select('id, class_id, subject_id, date, start_time, end_time')
        .in('id', subIds);

      const classIds = Array.from(new Set((subs ?? []).map((s: any) => s.class_id)));
      const subjectIds = Array.from(new Set((subs ?? []).map((s: any) => s.subject_id)));

      const [{ data: classes }, { data: subjects }] = await Promise.all([
        supabase.from('classes').select('id, name').in('id', classIds),
        supabase.from('subjects').select('id, name').in('id', subjectIds),
      ]);

      const classMap = new Map((classes ?? []).map((c: any) => [c.id, c.name]));
      const subjectMap = new Map((subjects ?? []).map((s: any) => [s.id, s.name]));
      const subMap = new Map((subs ?? []).map((s: any) => [s.id, s]));

      const built: BannerData[] = alerts.map((alert) => {
        const sub = subMap.get(alert.substitution_id) as any;
        const student = studentMap.get(alert.student_id);
        return {
          alert,
          studentName: student?.full_name ?? 'Student',
          className: sub ? classMap.get(sub.class_id) ?? '-' : '-',
          subjectName: sub ? subjectMap.get(sub.subject_id) ?? '-' : '-',
          date: sub?.date ?? '-',
          timeBlock: sub ? `${sub.start_time} - ${sub.end_time}` : '-',
        };
      });

      setBanners(built);
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = async (alertId: string) => {
    await supabase
      .from('attendance_alerts')
      .update({ is_dismissed: true })
      .eq('id', alertId);
    setBanners((prev) => prev.filter((b) => b.alert.id !== alertId));
  };

  if (banners.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {banners.map((b) => (
        <div
          key={b.alert.id}
          className="critical-banner flex items-start gap-3 animate-slide-in"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-critical-pulse" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              CRITICAL: Mandatory Attendance Alert for {b.studentName}
            </p>
            <p className="text-xs mt-0.5 opacity-90">
              Attendance is strictly mandatory on{' '}
              <span className="font-semibold">{b.date}</span> from{' '}
              <span className="font-semibold">{b.timeBlock}</span> for{' '}
              <span className="font-semibold">{b.subjectName}</span> ({b.className}) due to
              critical lesson coverage. Non-attendance will be recorded and reported.
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs opacity-80">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> SMS sent
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> WhatsApp sent
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email sent
              </span>
              <span className="flex items-center gap-1">
                <Bell className="w-3 h-3" /> Banner active
              </span>
            </div>
          </div>
          <button
            onClick={() => dismiss(b.alert.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
