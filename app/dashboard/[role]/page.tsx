'use client';

import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/shell';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { AccountantDashboard } from '@/components/dashboards/accountant-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { ParentDashboard } from '@/components/dashboards/parent-dashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const params = useParams();
  const role = params.role as string;

  const validRoles = ['admin', 'accountant', 'teacher', 'student', 'parent'];
  if (!validRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <p className="text-[#0F2942]">Invalid dashboard.</p>
      </div>
    );
  }

  return (
    <DashboardShell role={role}>
      {(activeSection: string) => {
        if (role === 'admin') return <AdminDashboard section={activeSection} />;
        if (role === 'accountant') return <AccountantDashboard section={activeSection} />;
        if (role === 'teacher') return <TeacherDashboard section={activeSection} />;
        if (role === 'student') return <StudentDashboard section={activeSection} />;
        if (role === 'parent') return <ParentDashboard section={activeSection} />;
        return <Loader2 className="w-6 h-6 animate-spin" />;
      }}
    </DashboardShell>
  );
}
