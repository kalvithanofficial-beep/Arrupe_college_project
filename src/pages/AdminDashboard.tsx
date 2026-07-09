import { useEffect, useState, FormEvent } from 'react';
import { GraduationCap, Users, CalendarCheck, UserPlus, Plus, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Staff, Notice } from '../types';
import StatCard from '../components/ui/StatCard';
import NoticeCard from '../components/ui/NoticeCard';

interface SubForm {
  date: string;
  class_name: string;
  subject: string;
  acting_teacher: string;
  time_slot: string;
  reason: string;
}

const CLASSES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function AdminDashboard() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [subForm, setSubForm] = useState<SubForm>({
    date: new Date().toISOString().split('T')[0],
    class_name: '',
    subject: '',
    acting_teacher: '',
    time_slot: '',
    reason: '',
  });
  const [subSuccess, setSubSuccess] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [addStaffName, setAddStaffName] = useState('');
  const [addStaffRole, setAddStaffRole] = useState('Teacher');
  const [addStaffDept, setAddStaffDept] = useState('');
  const [addStaffEmail, setAddStaffEmail] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function fetchData() {
      setStatsLoading(true);
      setStatsError('');
      try {
        const today = new Date().toISOString().split('T')[0];

        const [
          { data: staffData },
          { count: sc },
          { count: tc },
          { data: noticesData },
          { count: presentCount },
          { count: totalAttendanceCount },
        ] = await Promise.all([
          supabase.from('staff').select('*').abortSignal(controller.signal).eq('is_active', true).order('name').limit(5),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('role', 'student'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('role', 'teacher'),
          supabase.from('notices').select('*').abortSignal(controller.signal).order('created_at', { ascending: false }).limit(5),
          supabase.from('attendance_records').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('date', today).eq('present', true),
          supabase.from('attendance_records').select('*', { count: 'exact', head: true }).abortSignal(controller.signal).eq('date', today),
        ]);

        if (!mounted || controller.signal.aborted) return;
        if (staffData) setStaff(staffData as Staff[]);
        if (sc !== null) setStudentCount(sc);
        if (tc !== null) setTeacherCount(tc);
        if (noticesData) setNotices(noticesData as Notice[]);

        const p = presentCount ?? 0;
        const t = totalAttendanceCount ?? 0;
        if (t > 0) {
          setAttendanceRate(Math.round((p / t) * 1000) / 10); // one decimal place
        } else {
          setAttendanceRate(null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Dashboard stats error:', err);
        setStatsError('Failed to load dashboard statistics.');
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  async function handleSubstitution(e: FormEvent) {
    e.preventDefault();
    setSubLoading(true);
    const { error } = await supabase.from('substitutions').insert(subForm);
    setSubLoading(false);
    if (!error) {
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 3000);
      setSubForm({ date: new Date().toISOString().split('T')[0], class_name: '', subject: '', acting_teacher: '', time_slot: '', reason: '' });
    }
  }

  async function handleAddStaff(e: FormEvent) {
    e.preventDefault();
    setAddStaffLoading(true);
    const { data, error } = await supabase.from('staff').insert({
      name: addStaffName, role: addStaffRole, department: addStaffDept, email: addStaffEmail
    }).select().single();
    setAddStaffLoading(false);
    if (!error && data) {
      setStaff(prev => [...prev, data as Staff]);
      setAddStaffName(''); setAddStaffRole('Teacher'); setAddStaffDept(''); setAddStaffEmail('');
      setShowAddStaff(false);
    }
  }

  const activeTeachers = teacherCount || staff.filter(s => s.role === 'Teacher').length;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {statsError && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <Check size={16} />
          {statsError}
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<GraduationCap size={20} />}
          label="Total Students"
          value={statsLoading ? 'Loading...' : (studentCount || 0).toLocaleString()}
          change="+2.4%"
          changePositive
        />
        <StatCard
          icon={<Users size={20} />}
          label="Active Teachers"
          value={statsLoading ? 'Loading...' : String(activeTeachers)}
          badge="Stable"
          badgeColor="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={<CalendarCheck size={20} />}
          label="Daily Attendance"
          value={statsLoading ? 'Loading...' : attendanceRate !== null ? `${attendanceRate}%` : '—'}
          change={statsLoading ? '' : attendanceRate !== null ? '' : ''}
          changePositive={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Sub + Staff */}
        <div className="lg:col-span-2 space-y-6">
          {/* Smart Substitution */}
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <CalendarCheck size={20} className="text-slate-600" />
              </div>
              <div>
                <h2 className="font-bold text-navy-900 text-lg">Smart Substitution</h2>
                <p className="text-slate-500 text-sm">Assign acting teachers for absent staff.</p>
              </div>
            </div>

            {subSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                <Check size={16} />
                Substitution finalized successfully!
              </div>
            )}

            <form onSubmit={handleSubstitution} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={subForm.date}
                    onChange={e => setSubForm(p => ({ ...p, date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Class</label>
                  <select
                    value={subForm.class_name}
                    onChange={e => setSubForm(p => ({ ...p, class_name: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select class...</option>
                    {CLASSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Acting Teacher</label>
                <select
                  value={subForm.acting_teacher}
                  onChange={e => setSubForm(p => ({ ...p, acting_teacher: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select available teacher...</option>
                  {staff.filter(s => s.role === 'Teacher').map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subForm.subject}
                    onChange={e => setSubForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Physics"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Time Slot</label>
                  <input
                    type="time"
                    value={subForm.time_slot}
                    onChange={e => setSubForm(p => ({ ...p, time_slot: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason for Absence</label>
                <textarea
                  value={subForm.reason}
                  onChange={e => setSubForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Briefly explain..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <button type="submit" disabled={subLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {subLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={16} /> Finalize Substitution</>}
              </button>
            </form>
          </div>

          {/* Staff Directory */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-navy-900 text-lg">Staff Directory</h2>
                <p className="text-slate-500 text-sm">Role-based access management</p>
              </div>
              <button
                onClick={() => setShowAddStaff(v => !v)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <UserPlus size={16} />
                Add New Staff
              </button>
            </div>

            {showAddStaff && (
              <form onSubmit={handleAddStaff} className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={addStaffName} onChange={e => setAddStaffName(e.target.value)} placeholder="Full Name" className="input-field" required />
                  <select value={addStaffRole} onChange={e => setAddStaffRole(e.target.value)} className="input-field">
                    <option>Teacher</option><option>Accountant</option><option>Admin</option><option>Counselor</option>
                  </select>
                  <input value={addStaffDept} onChange={e => setAddStaffDept(e.target.value)} placeholder="Department" className="input-field" />
                  <input value={addStaffEmail} onChange={e => setAddStaffEmail(e.target.value)} placeholder="Email" type="email" className="input-field" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addStaffLoading} className="btn-primary text-sm flex items-center gap-1.5">
                    {addStaffLoading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
                    Add Staff
                  </button>
                  <button type="button" onClick={() => setShowAddStaff(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3">Dept/Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staff.map(s => (
                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-navy-900">{s.name}</div>
                            <div className="text-xs text-slate-400">{s.email || `${s.name.toLowerCase().replace(' ', '.')}@arrupecollege.edu`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={s.role === 'Teacher' ? 'badge-teacher' : s.role === 'Accountant' ? 'badge-accountant' : 'badge-admin'}>
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-slate-600">{s.department || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button className="text-accent-600 text-sm font-medium hover:text-accent-700 transition-colors">
                View All Staff ({activeTeachers}) →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Notices + System Logs */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900">Notices</h2>
              <button className="w-8 h-8 bg-accent-500 hover:bg-accent-600 text-white rounded-lg flex items-center justify-center transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {notices.slice(0, 5).map(n => <NoticeCard key={n.id} notice={n} />)}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-slate-500" />
              <h2 className="font-bold text-navy-900">System Logs</h2>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Storage</span>
                <span className="text-xs font-semibold text-slate-700">72% used</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-accent-500 h-2.5 rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: 'Server Status', status: 'Online', color: 'bg-emerald-400' },
                { label: 'Last Backup', status: '2h ago', color: 'bg-blue-400' },
                { label: 'SMS Gateway', status: 'Active', color: 'bg-emerald-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-slate-700 text-xs font-medium">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Campus"
                className="w-full h-32 object-cover"
              />
              <div className="bg-navy-900 px-3 py-2">
                <div className="text-white text-xs font-semibold">Campus Vision 2025</div>
                <div className="text-slate-400 text-xs">The future of Arrupe College starts here.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
