'use client';

import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/shell';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { AccountantDashboard } from '@/components/dashboards/accountant-dashboard';
import { TeacherDashboard } from '@/components/dashboards/teacher-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { ParentDashboard } from '@/components/dashboards/parent-dashboard';
import { Loader2 } from 'lucide-react';

function DashboardContent({ role, section }: { role: string; section: string }) {
  if (role === 'admin') return <AdminDashboard section={section} />;
  if (role === 'accountant') return <AccountantDashboard section={section} />;
  if (role === 'teacher') return <TeacherDashboard section={section} />;
  if (role === 'student') return <StudentDashboard section={section} />;
  if (role === 'parent') return <ParentDashboard section={section} />;
  return <Loader2 className="w-6 h-6 animate-spin" />;
}

export default function DashboardPage() {
  const params = useParams();
  const role = String(params.role || '').toLowerCase();

  const validRoles = ['admin', 'accountant', 'teacher', 'student', 'parent'];
  if (!validRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <p className="text-[#0F2942]">Invalid dashboard.</p>
      </div>
    );
  }

  return <DashboardShell role={role}>{(activeSection: string) => <DashboardContent role={role} section={activeSection} />}</DashboardShell>;
}
