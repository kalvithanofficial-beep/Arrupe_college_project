'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth, roleLabel } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  Megaphone,
  UserCog,
  LogOut,
  Menu,
  X,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import { PasswordResetDialog } from './password-reset';
import { downloadMonthlyBackup } from '@/lib/pdf';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'accountant', 'teacher', 'student', 'parent'] },
  { id: 'users', label: 'Manage Users', icon: Users, roles: ['admin'] },
  { id: 'classes', label: 'Classes & Teachers', icon: UserCog, roles: ['admin'] },
  { id: 'notices', label: 'Notice Board', icon: Megaphone, roles: ['admin'] },
  { id: 'substitutions', label: 'Substitutions', icon: CalendarDays, roles: ['admin'] },
  { id: 'payments', label: 'Payments', icon: Receipt, roles: ['accountant', 'admin'] },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['teacher'] },
  { id: 'marks', label: 'Marks Entry', icon: BookOpen, roles: ['teacher'] },
  { id: 'my-marks', label: 'My Marks', icon: BookOpen, roles: ['student', 'parent'] },
  { id: 'my-attendance', label: 'My Attendance', icon: ClipboardCheck, roles: ['student', 'parent'] },
  { id: 'my-timetable', label: 'Timetable', icon: CalendarDays, roles: ['student', 'parent'] },
  { id: 'my-fees', label: 'Fee Dues', icon: Receipt, roles: ['student', 'parent'] },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export function DashboardSidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!profile) return null;

  const items = NAV_ITEMS.filter((i) => i.roles.includes(profile.role));
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const backupData = await fetchBackupData(profile.role, profile.id);
      downloadMonthlyBackup({
        role: profile.role,
        userName: profile.full_name,
        title: backupData.title,
        columns: backupData.columns,
        rows: backupData.rows,
        summary: backupData.summary,
      });
      toast({ title: 'Backup downloaded', description: 'Your monthly PDF backup has been saved.' });
    } catch (e: any) {
      toast({ title: 'Backup failed', description: e.message, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Title */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Image
          src="/logo.svg"
          alt="ARRUPE College Logo"
          width={40}
          height={40}
          className="w-10 h-10 object-contain"
          priority
        />
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">ARRUPE College</h1>
          <p className="text-white/60 text-xs">Batticaloa</p>
        </div>
        <button
          className="ml-auto lg:hidden text-white/70 hover:text-white"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm">
          <Avatar className="w-10 h-10 border-2 border-[#D95D16]">
            <AvatarFallback className="bg-[#D95D16] text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{profile.full_name}</p>
            <Badge className="mt-0.5 bg-[#D95D16]/20 text-[#e8732c] border border-[#D95D16]/30 text-xs hover:bg-[#D95D16]/30">
              {roleLabel(profile.role)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-[#D95D16] text-white shadow-lg shadow-[#D95D16]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-transform', active ? 'scale-110' : 'group-hover:scale-110')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <Button
          onClick={handleBackup}
          disabled={downloading}
          className="w-full bg-[#D95D16] hover:bg-[#b54d10] text-white font-semibold rounded-xl shadow-md transition-all duration-200"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          System Backup
        </Button>
        <PasswordResetDialog />
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#0F2942] text-white shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 sidebar fixed inset-y-0 left-0 z-30 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

async function fetchBackupData(role: string, userId: string) {
  if (role === 'admin') {
    const { data: users } = await supabase.from('profiles').select('email, role, full_name, status, created_at');
    const { count: subs } = await supabase.from('substitutions').select('id', { count: 'exact', head: true }).eq('status', 'active');
    const { count: notices } = await supabase.from('notices').select('id', { count: 'exact', head: true }).eq('is_active', true);
    return {
      title: 'System Users Log',
      columns: ['Email', 'Role', 'Name', 'Status', 'Created'],
      rows: (users ?? []).map((u: any) => [u.email, u.role, u.full_name, u.status, new Date(u.created_at).toLocaleDateString()]),
      summary: [
        { label: 'Total Users', value: String(users?.length ?? 0) },
        { label: 'Active Substitutions', value: String(subs ?? 0) },
        { label: 'Active Notices', value: String(notices ?? 0) },
        { label: 'Backup Type', value: 'Admin - Full System Log' },
      ],
    };
  }
  if (role === 'accountant') {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_method, payment_date, payment_reference, notes, students(full_name)')
      .order('payment_date', { ascending: false })
      .limit(100);
    const total = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const cashTotal = (payments ?? []).filter((p: any) => p.payment_method === 'cash').reduce((s: number, p: any) => s + Number(p.amount), 0);
    const chequeTotal = (payments ?? []).filter((p: any) => p.payment_method === 'cheque').reduce((s: number, p: any) => s + Number(p.amount), 0);
    const bankTotal = (payments ?? []).filter((p: any) => p.payment_method === 'bank_deposit').reduce((s: number, p: any) => s + Number(p.amount), 0);
    return {
      title: 'Fee Collections Log',
      columns: ['Date', 'Student', 'Method', 'Reference', 'Amount', 'Notes'],
      rows: (payments ?? []).map((p: any) => [p.payment_date, p.students?.full_name ?? '-', p.payment_method, p.payment_reference ?? '-', `Rs. ${p.amount}`, p.notes ?? '-']),
      summary: [
        { label: 'Total Collected', value: `Rs. ${total.toFixed(2)}` },
        { label: 'Cash', value: `Rs. ${cashTotal.toFixed(2)}` },
        { label: 'Cheque', value: `Rs. ${chequeTotal.toFixed(2)}` },
        { label: 'Bank Deposit', value: `Rs. ${bankTotal.toFixed(2)}` },
        { label: 'Transactions', value: String(payments?.length ?? 0) },
      ],
    };
  }
  if (role === 'teacher') {
    const { data: marks } = await supabase
      .from('marks')
      .select('marks_obtained, max_marks, academic_year, published, created_at, students(full_name, roll_number), subjects(name), exam_terms(name)')
      .eq('entered_by', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    const published = (marks ?? []).filter((m: any) => m.published).length;
    return {
      title: 'Broadsheet Marks Entry Log',
      columns: ['Student', 'Roll', 'Subject', 'Term', 'Marks', 'Max', 'Year', 'Published', 'Date'],
      rows: (marks ?? []).map((m: any) => [
        m.students?.full_name ?? '-',
        m.students?.roll_number ?? '-',
        m.subjects?.name ?? '-',
        m.exam_terms?.name ?? '-',
        m.marks_obtained,
        m.max_marks,
        m.academic_year,
        m.published ? 'Yes' : 'No',
        new Date(m.created_at).toLocaleDateString(),
      ]),
      summary: [
        { label: 'Total Entries', value: String(marks?.length ?? 0) },
        { label: 'Published', value: String(published) },
        { label: 'Drafts', value: String((marks?.length ?? 0) - published) },
        { label: 'Type', value: 'Teacher - Broadsheet Marks Log' },
      ],
    };
  }
  if (role === 'student') {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, admission_number, classes(name)')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (student) {
      const { data: marks } = await supabase
        .from('marks')
        .select('marks_obtained, max_marks, academic_year, published, subjects(name), exam_terms(name)')
        .eq('student_id', student.id)
        .eq('published', true)
        .order('academic_year', { ascending: false });
      const { data: attendance } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', student.id)
        .order('date', { ascending: false });
      const present = (attendance ?? []).filter((a: any) => a.status === 'present').length;
      const attPct = (attendance ?? []).length > 0 ? Math.round((present / (attendance ?? []).length) * 100) : 0;
      return {
        title: 'My Academic Record',
        columns: ['Subject', 'Term', 'Marks', 'Max', 'Year'],
        rows: (marks ?? []).map((m: any) => [m.subjects?.name ?? '-', m.exam_terms?.name ?? '-', m.marks_obtained, m.max_marks, m.academic_year]),
        summary: [
          { label: 'Student Name', value: student.full_name },
          { label: 'Admission #', value: student.admission_number ?? 'N/A' },
          { label: 'Class', value: (student.classes as any)?.name ?? '-' },
          { label: 'Marks Records', value: String(marks?.length ?? 0) },
          { label: 'Attendance Records', value: String(attendance?.length ?? 0) },
          { label: 'Attendance %', value: `${attPct}%` },
        ],
      };
    }
    return { title: 'My Record', columns: ['Info'], rows: [['No data']], summary: [] };
  }
  if (role === 'parent') {
    const { data: children } = await supabase
      .from('students')
      .select('full_name, admission_number, class_id, classes(name)')
      .eq('parent_id', userId);
    const enriched = await Promise.all((children ?? []).map(async (c: any) => {
      const { data: inv } = await supabase.from('invoices').select('total_amount, amount_paid').eq('student_id', c.id);
      const dues = (inv ?? []).reduce((s: number, i: any) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0);
      const { data: att } = await supabase.from('attendance').select('status').eq('student_id', c.id);
      const present = (att ?? []).filter((a: any) => a.status === 'present').length;
      const pct = (att ?? []).length > 0 ? Math.round((present / (att ?? []).length) * 100) : 0;
      return { name: c.full_name, adm: c.admission_number ?? '-', className: c.classes?.name ?? '-', dues, attPct: pct };
    }));
    const totalDues = enriched.reduce((s, c) => s + c.dues, 0);
    return {
      title: 'Children Overview',
      columns: ['Child Name', 'Admission #', 'Class', 'Attendance', 'Dues (Rs.)'],
      rows: enriched.map((c) => [c.name, c.adm, c.className, `${c.attPct}%`, c.dues.toFixed(0)]),
      summary: [
        { label: 'Children', value: String(children?.length ?? 0) },
        { label: 'Total Dues', value: `Rs. ${totalDues.toFixed(2)}` },
        { label: 'Type', value: 'Parent - Children Overview' },
      ],
    };
  }
  return { title: 'No Data', columns: ['Info'], rows: [['No backup data for this role']], summary: [] };
}
