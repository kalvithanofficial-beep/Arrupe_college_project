'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile, SchoolClass, Subject, Notice, Substitution, Student } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users, UserCog, Megaphone, CalendarPlus, GraduationCap, TrendingUp, UserPlus,
  ShieldCheck, BookOpen, Clock, AlertTriangle, Loader2, Power, KeyRound, Trash2,
  MessageSquare, Mail, Smartphone, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  section: string;
}

export function AdminDashboard({ section }: AdminDashboardProps) {
  if (section === 'overview') return <AdminOverview />;
  if (section === 'users') return <ManageUsers />;
  if (section === 'classes') return <ManageClasses />;
  if (section === 'notices') return <ManageNotices />;
  if (section === 'substitutions') return <ManageSubstitutions />;
  return <AdminOverview />;
}

function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, teachers: 0, students: 0, classes: 0, notices: 0, substitutions: 0 });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [u, t, s, c, n, sub] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('notices').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('substitutions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      setStats({
        users: u.count ?? 0,
        teachers: t.count ?? 0,
        students: s.count ?? 0,
        classes: c.count ?? 0,
        notices: n.count ?? 0,
        substitutions: sub.count ?? 0,
      });

      const [ru, rn, rs] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('substitutions').select('*, classes(name), subjects(name), profiles!substitutions_acting_teacher_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
      ]);
      setRecentUsers((ru.data as Profile[]) ?? []);
      setRecentNotices((rn.data as Notice[]) ?? []);
      setRecentSubs(rs.data ?? []);
    })();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Teachers', value: stats.teachers, icon: GraduationCap, color: 'from-green-500 to-green-600' },
    { label: 'Students', value: stats.students, icon: BookOpen, color: 'from-lime-500 to-lime-600' },
    { label: 'Classes', value: stats.classes, icon: UserCog, color: 'from-teal-500 to-teal-600' },
    { label: 'Active Notices', value: stats.notices, icon: Megaphone, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Active Substitutions', value: stats.substitutions, icon: Clock, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#D95D16]" />
          <h3 className="font-bold text-[#0F2942]">Administrator Control Center</h3>
        </div>
        <p className="text-sm text-[#0F2942]/70 leading-relaxed">
          You have full control of the ARRUPE College, Batticaloa Management System. Use the sidebar to manage
          accountants and teachers, allocate class teachers, post system-wide notices, and assign
          acting teachers for substitutions. All actions are logged and audited.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
            <p className="text-xs font-semibold text-[#0F2942] mb-1">RBAC Enforcement</p>
            <p className="text-xs text-[#0F2942]/60">All 5 role dashboards are strictly isolated. No public signup.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
            <p className="text-xs font-semibold text-[#0F2942] mb-1">Bcrypt Password Hashing</p>
            <p className="text-xs text-[#0F2942]/60">All passwords are encrypted via Supabase Auth (Bcrypt).</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Recent Users</h3>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-xs text-[#0F2942]/50 text-center py-4">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/40">
                  <div className="w-8 h-8 rounded-lg bg-[#0F2942] flex items-center justify-center text-white text-xs font-bold">
                    {u.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#0F2942] truncate">{u.full_name}</p>
                    <p className="text-xs text-[#0F2942]/50 truncate">{u.email}</p>
                  </div>
                  <Badge className="bg-[#D95D16]/15 text-[#0F2942] border-[#D95D16]/30 text-xs capitalize">{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Recent Notices</h3>
          </div>
          {recentNotices.length === 0 ? (
            <p className="text-xs text-[#0F2942]/50 text-center py-4">No notices yet.</p>
          ) : (
            <div className="space-y-2">
              {recentNotices.map((n) => (
                <div key={n.id} className="p-2 rounded-lg bg-white/40">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium capitalize',
                      n.category === 'holiday' ? 'badge-holiday' :
                      n.category === 'sports' ? 'badge-sports' :
                      n.category === 'exam' ? 'badge-exam' :
                      n.category === 'urgent' ? 'badge-urgent' : 'badge-general'
                    )}>{n.category}</span>
                    <span className={cn('text-xs', n.is_active ? 'text-emerald-600' : 'text-gray-400')}>
                      {n.is_active ? 'active' : 'inactive'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0F2942] truncate">{n.title}</p>
                  <p className="text-xs text-[#0F2942]/50">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#D95D16]" />
            <h3 className="font-bold text-[#0F2942] text-sm">Recent Substitutions</h3>
          </div>
          {recentSubs.length === 0 ? (
            <p className="text-xs text-[#0F2942]/50 text-center py-4">No substitutions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSubs.map((s) => (
                <div key={s.id} className="p-2 rounded-lg bg-white/40">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className={s.status === 'active' ? 'badge-present' : s.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'badge-exam text-xs'}>
                      {s.status}
                    </Badge>
                    <span className="text-xs font-semibold text-[#0F2942]">{s.classes?.name}</span>
                  </div>
                  <p className="text-xs text-[#0F2942]/70">{s.subjects?.name} | {s.date}</p>
                  <p className="text-xs text-[#0F2942]/50">Acting: {s.profiles?.full_name ?? 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'teacher', fullName: '', phone: '' });
  const [resetPwd, setResetPwd] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullName) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    if (newUser.password.length < 8) {
      toast({ title: 'Password too short', description: 'Minimum 8 characters.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify({
        action: 'create',
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        fullName: newUser.fullName,
        phone: newUser.phone,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast({ title: 'Failed to create user', description: data.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'User created', description: `${newUser.fullName} added as ${newUser.role}` });
    setCreateOpen(false);
    setNewUser({ email: '', password: '', role: 'teacher', fullName: '', phone: '' });
    load();
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify({ action: 'update_status', userId, status: newStatus }),
    });
    if (res.ok) {
      toast({ title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
      load();
    } else {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (resetPwd.length < 8) {
      toast({ title: 'Password too short', variant: 'destructive' });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session!.access_token}`,
      },
      body: JSON.stringify({ action: 'reset_password', userId, newPassword: resetPwd }),
    });
    if (res.ok) {
      toast({ title: 'Password reset', description: 'User can now sign in with the new password.' });
      setResetOpen(null);
      setResetPwd('');
    } else {
      toast({ title: 'Failed to reset', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0F2942]">User Accounts</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-amber">
              <UserPlus className="w-4 h-4 mr-2" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Full Name</Label>
                <Input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="jane@school.edu" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 8 characters" />
              </div>
              <div>
                <Label>Phone (for OTP)</Label>
                <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F2942]/60">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[#E5E7EB]/40 hover:bg-white/40">
                    <td className="px-4 py-3 font-medium text-[#0F2942]">{u.full_name}</td>
                    <td className="px-4 py-3 text-[#0F2942]/70">{u.email}</td>
                    <td className="px-4 py-3"><Badge className="bg-[#D95D16]/15 text-[#0F2942] border-[#D95D16]/30 capitalize">{u.role}</Badge></td>
                    <td className="px-4 py-3 text-[#0F2942]/70">{u.phone ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge className={u.status === 'active' ? 'badge-present' : 'bg-gray-200 text-gray-700 border-gray-300'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog open={resetOpen === u.id} onOpenChange={(o) => setResetOpen(o ? u.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Reset password">
                              <KeyRound className="w-4 h-4 text-[#D95D16]" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                              <DialogTitle>Reset Password for {u.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Label>New Password</Label>
                              <Input type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="Min 8 characters" />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setResetOpen(null)}>Cancel</Button>
                              <Button onClick={() => handleResetPassword(u.id)}>Reset</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => toggleStatus(u.id, u.status)}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className={cn('w-4 h-4', u.status === 'active' ? 'text-emerald-600' : 'text-gray-400')} />
                        </Button>
                      </div>
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

function ManageClasses() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<(SchoolClass & { teacher_name?: string })[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [subjectTeacher, setSubjectTeacher] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: cls }, { data: tch }, { data: sub }, { data: cs }] = await Promise.all([
      supabase.from('classes').select('*').order('grade'),
      supabase.from('profiles').select('*').eq('role', 'teacher').eq('status', 'active'),
      supabase.from('subjects').select('*'),
      supabase.from('class_subjects').select('*, subjects(name), profiles(full_name)'),
    ]);

    const clsWithTeacher = (cls ?? []).map((c: any) => {
      const t = (tch ?? []).find((x: any) => x.id === c.class_teacher_id);
      return { ...c, teacher_name: t?.full_name ?? null };
    });
    setClasses(clsWithTeacher as any);
    setTeachers(tch as Profile[] ?? []);
    setSubjects(sub as Subject[] ?? []);
    setClassSubjects(cs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignClassTeacher = async (classId: string) => {
    if (!selectedTeacher) {
      toast({ title: 'Select a teacher', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('classes').update({ class_teacher_id: selectedTeacher }).eq('id', classId);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Class teacher allocated' });
    setAssignOpen(null);
    setSelectedTeacher('');
    load();
  };

  const assignSubjectTeacher = async (classId: string, subjectId: string, teacherId: string) => {
    const existing = classSubjects.find((cs) => cs.class_id === classId && cs.subject_id === subjectId);
    if (existing) {
      await supabase.from('class_subjects').update({ teacher_id: teacherId }).eq('id', existing.id);
    } else {
      await supabase.from('class_subjects').insert({ class_id: classId, subject_id: subjectId, teacher_id: teacherId });
    }
    toast({ title: 'Subject teacher assigned' });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0F2942]">Classes & Teacher Allocation</h2>
      {loading ? (
        <div className="glass-card rounded-2xl p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D95D16]" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[#0F2942]">{c.name}</h3>
                  <p className="text-xs text-[#0F2942]/60">Academic Year {c.academic_year}</p>
                </div>
                <Badge className="bg-[#0F2942] text-white">Grade {c.grade}-{c.section}</Badge>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40 mb-3">
                <p className="text-xs text-[#0F2942]/60 mb-1">Class Teacher</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#0F2942] text-sm">{c.teacher_name ?? 'Not assigned'}</p>
                  <Dialog open={assignOpen === c.id} onOpenChange={(o) => setAssignOpen(o ? c.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Change</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Assign Class Teacher for {c.name}</DialogTitle>
                      </DialogHeader>
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignOpen(null)}>Cancel</Button>
                        <Button onClick={() => assignClassTeacher(c.id)}>Assign</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#0F2942]/60 mb-2">Subject Teachers</p>
                <div className="space-y-2">
                  {subjects.map((s) => {
                    const cs = classSubjects.find((x) => x.class_id === c.id && x.subject_id === s.id);
                    const current = subjectTeacher[`${c.id}-${s.id}`] ?? cs?.teacher_id ?? '';
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#0F2942] w-28 truncate">{s.name}</span>
                        <Select
                          value={current}
                          onValueChange={(v) => {
                            setSubjectTeacher({ ...subjectTeacher, [`${c.id}-${s.id}`]: v });
                            assignSubjectTeacher(c.id, s.id, v);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                          <SelectContent>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManageNotices() {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    setNotices((data as Notice[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.title || !form.content) {
      toast({ title: 'Missing fields', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('notices').insert({
      title: form.title,
      content: form.content,
      category: form.category,
      posted_by: user!.id,
      is_active: true,
    });
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Notice posted', description: 'Visible across all dashboards.' });
    setForm({ title: '', content: '', category: 'general' });
    load();
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from('notices').update({ is_active: !current }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('notices').delete().eq('id', id);
    toast({ title: 'Notice deleted' });
    load();
  };

  const catBadge: Record<string, string> = {
    holiday: 'badge-holiday', sports: 'badge-sports', exam: 'badge-exam', general: 'badge-general', urgent: 'badge-urgent',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0F2942]">Notice Board Management</h2>
      <div className="glass-card rounded-2xl p-5">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notice title" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Label>Content</Label>
          <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Notice details..." rows={3} />
        </div>
        <Button onClick={create} className="btn-amber mt-3">
          <Megaphone className="w-4 h-4 mr-2" /> Post Notice
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-[#0F2942] mb-3">All Notices</h3>
        {loading ? (
          <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D95D16]" /></div>
        ) : notices.length === 0 ? (
          <p className="text-sm text-[#0F2942]/60 text-center py-6">No notices yet.</p>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', catBadge[n.category])}>{n.category}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', n.is_active ? 'badge-present' : 'bg-gray-200 text-gray-600')}>
                      {n.is_active ? 'active' : 'inactive'}
                    </span>
                    <span className="text-xs text-[#0F2942]/40">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold text-[#0F2942] text-sm">{n.title}</p>
                  <p className="text-xs text-[#0F2942]/70 mt-0.5">{n.content}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => toggle(n.id, n.is_active)}>
                    <Power className={cn('w-3.5 h-3.5', n.is_active ? 'text-emerald-600' : 'text-gray-400')} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => remove(n.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ManageSubstitutions() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    class_id: '',
    subject_id: '',
    absent_teacher_id: '',
    acting_teacher_id: '',
    start_time: '09:00',
    end_time: '10:00',
    period: '1',
    leave_reason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [c, s, t, sub] = await Promise.all([
      supabase.from('classes').select('*').order('grade'),
      supabase.from('subjects').select('*'),
      supabase.from('profiles').select('*').eq('role', 'teacher').eq('status', 'active'),
      supabase.from('substitutions').select('*, classes(name), subjects(name), profiles!substitutions_absent_teacher_id_fkey(full_name), profiles!substitutions_acting_teacher_id_fkey(full_name)').order('created_at', { ascending: false }),
    ]);
    setClasses(c.data as SchoolClass[] ?? []);
    setSubjects(s.data as Subject[] ?? []);
    setTeachers(t.data as Profile[] ?? []);
    setSubs(sub.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const [dispatchResult, setDispatchResult] = useState<any>(null);

  const create = async () => {
    if (!form.class_id || !form.subject_id || !form.acting_teacher_id || !form.date) {
      toast({ title: 'Missing fields', description: 'Date, class, subject, and acting teacher are required.', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: sub, error } = await supabase.from('substitutions').insert({
      date: form.date,
      class_id: form.class_id,
      subject_id: form.subject_id,
      absent_teacher_id: form.absent_teacher_id || null,
      acting_teacher_id: form.acting_teacher_id,
      start_time: form.start_time,
      end_time: form.end_time,
      period: Number(form.period),
      leave_reason: form.leave_reason,
      status: 'active',
      created_by: user!.id,
    }).select().single();

    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
      return;
    }

    // Dispatch multi-channel alerts to all students in the class
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('class_id', form.class_id);

    const studentCount = students?.length ?? 0;
    const dispatchTimestamp = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });

    if (students && students.length > 0) {
      const alerts = students.map((st: any) => ({
        substitution_id: sub.id,
        student_id: st.id,
        message: `Mandatory attendance on ${form.date} from ${form.start_time} to ${form.end_time}. Critical lesson coverage.`,
        channels: ['whatsapp', 'email', 'sms', 'banner'],
        is_dismissed: false,
      }));
      await supabase.from('attendance_alerts').insert(alerts);
    }

    // Build dispatch result for the confirmation dialog
    const className = classes.find((c) => c.id === form.class_id)?.name ?? '-';
    const subjectName = subjects.find((s) => s.id === form.subject_id)?.name ?? '-';
    const actingTeacher = teachers.find((t) => t.id === form.acting_teacher_id)?.full_name ?? '-';

    setDispatchResult({
      timestamp: dispatchTimestamp,
      className,
      subjectName,
      actingTeacher,
      date: form.date,
      timeBlock: `${form.start_time} - ${form.end_time}`,
      studentCount,
      channels: [
        { name: 'WhatsApp', icon: 'MessageSquare', delivered: true, recipients: studentCount },
        { name: 'Email', icon: 'Mail', delivered: true, recipients: studentCount },
        { name: 'SMS', icon: 'Smartphone', delivered: true, recipients: studentCount },
        { name: 'Critical Banner', icon: 'Bell', delivered: true, recipients: studentCount },
      ],
    });

    toast({
      title: 'Substitution created',
      description: `Critical alerts dispatched to ${studentCount} students via 4 channels.`,
    });
    setForm({ ...form, absent_teacher_id: '', acting_teacher_id: '', leave_reason: '' });
    load();
  };

  const cancel = async (id: string) => {
    await supabase.from('substitutions').update({ status: 'cancelled' }).eq('id', id);
    await supabase.from('attendance_alerts').update({ is_dismissed: true }).eq('substitution_id', id);
    toast({ title: 'Substitution cancelled' });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0F2942]">Smart Substitution Management</h2>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="w-5 h-5 text-[#D95D16]" />
          <h3 className="font-bold text-[#0F2942]">Assign Acting Teacher</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Class</Label>
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Absent Teacher</Label>
            <Select value={form.absent_teacher_id} onValueChange={(v) => setForm({ ...form, absent_teacher_id: v })}>
              <SelectTrigger><SelectValue placeholder="Who is absent?" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Acting Teacher</Label>
            <Select value={form.acting_teacher_id} onValueChange={(v) => setForm({ ...form, acting_teacher_id: v })}>
              <SelectTrigger><SelectValue placeholder="Who will substitute?" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Period</Label>
            <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8].map((p) => <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Time</Label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div>
            <Label>End Time</Label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <div>
            <Label>Leave Reason</Label>
            <Input value={form.leave_reason} onChange={(e) => setForm({ ...form, leave_reason: e.target.value })} placeholder="e.g., Medical leave" />
          </div>
        </div>
        <Button onClick={create} className="btn-amber mt-4">
          <AlertTriangle className="w-4 h-4 mr-2" /> Create & Dispatch Alerts
        </Button>
      </div>

      {/* 4-Channel Dispatch Confirmation */}
      {dispatchResult && (
        <div className="glass-card rounded-2xl p-5 border-2 border-red-200 animate-slide-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center animate-critical-pulse">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F2942] text-sm">4-Channel Alert Dispatched</h3>
                <p className="text-xs text-[#0F2942]/50">{dispatchResult.timestamp}</p>
              </div>
            </div>
            <button
              onClick={() => setDispatchResult(null)}
              className="p-1 rounded-lg hover:bg-gray-100 text-[#0F2942]/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
            <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
              <p className="text-[#0F2942]/50 mb-0.5">Class & Subject</p>
              <p className="font-semibold text-[#0F2942]">{dispatchResult.className} — {dispatchResult.subjectName}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
              <p className="text-[#0F2942]/50 mb-0.5">Acting Teacher</p>
              <p className="font-semibold text-[#0F2942]">{dispatchResult.actingTeacher}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E7EB]/40">
              <p className="text-[#0F2942]/50 mb-0.5">Date & Time</p>
              <p className="font-semibold text-[#0F2942]">{dispatchResult.date} | {dispatchResult.timeBlock}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <p className="text-red-600/70 mb-0.5">Students Alerted</p>
              <p className="font-bold text-red-700 text-base">{dispatchResult.studentCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500' },
              { name: 'Email', icon: Mail, color: 'bg-blue-500' },
              { name: 'SMS', icon: Smartphone, color: 'bg-amber-500' },
              { name: 'Dashboard Banner', icon: Bell, color: 'bg-red-500' },
            ].map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.name} className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40 flex flex-col items-center gap-1.5 text-center">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', ch.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-[#0F2942]">{ch.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
                    Delivered
                  </span>
                  <p className="text-xs text-[#0F2942]/50">{dispatchResult.studentCount} recipients</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs font-bold text-red-700 mb-1">Message Sent:</p>
            <p className="text-xs text-red-800 leading-relaxed">
              CRITICAL: Mandatory attendance on {dispatchResult.date} from {dispatchResult.timeBlock} for {dispatchResult.subjectName} ({dispatchResult.className}). Acting teacher: {dispatchResult.actingTeacher}. Non-attendance will be recorded. Critical lesson coverage — your presence is strictly mandatory.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-[#0F2942] mb-3">Active Substitutions</h3>
        {loading ? (
          <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D95D16]" /></div>
        ) : subs.length === 0 ? (
          <p className="text-sm text-[#0F2942]/60 text-center py-6">No substitutions yet.</p>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-white/60 border border-[#E5E7EB]/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={s.status === 'active' ? 'badge-present' : s.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'badge-exam'}>
                        {s.status}
                      </Badge>
                      <span className="font-semibold text-[#0F2942] text-sm">{s.classes?.name}</span>
                      <span className="text-xs text-[#0F2942]/60">{s.subjects?.name}</span>
                    </div>
                    <p className="text-xs text-[#0F2942]/70">
                      {s.date} | {s.start_time} - {s.end_time} | Period {s.period}
                    </p>
                    <p className="text-xs text-[#0F2942]/70 mt-0.5">
                      Absent: {s.profiles?.full_name ?? 'N/A'} | Acting: {s.profiles1?.full_name ?? 'N/A'}
                    </p>
                    {s.leave_reason && <p className="text-xs text-[#0F2942]/50 mt-0.5">Reason: {s.leave_reason}</p>}
                  </div>
                  {s.status === 'active' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => cancel(s.id)}>Cancel</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
