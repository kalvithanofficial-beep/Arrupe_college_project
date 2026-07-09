import { useState, FormEvent } from 'react';
// Added Globe to fix runtime ReferenceError when rendering Data & Privacy buttons.
import { Bell, Lock, Palette, Database, Shield, Check, AlertCircle, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { profile, updatePassword } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    attendance: true,
    fees: true,
    notices: true,
    grades: false,
    sms: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordForm.newPassword) {
      setError('New password is required');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    const { error: err } = await updatePassword(passwordForm.newPassword);
    setPasswordLoading(false);

    if (err) {
      setError(err.message || 'Failed to update password');
      return;
    }

    setSaved(true);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account and portal preferences</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          <Check size={16} /> Settings saved successfully!
        </div>
      )}

      <div className="space-y-5">
        {/* Profile */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-accent-500" />
            <h2 className="font-bold text-navy-900">Account Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">First Name</label>
              <input value={profile?.first_name || ''} className="input-field" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Last Name</label>
              <input value={profile?.last_name || ''} className="input-field" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input value={profile?.email || ''} type="email" className="input-field" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
              <input value={profile?.role || ''} className="input-field capitalize" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
              <input value={profile?.phone || ''} className="input-field" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Age</label>
              <input value={profile?.age || ''} className="input-field" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender</label>
              <input value={profile?.gender || ''} className="input-field" disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Religion</label>
              <input value={profile?.religion || ''} className="input-field" disabled />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Address</label>
              <textarea value={profile?.address || ''} className="input-field resize-none" rows={2} disabled />
            </div>
          </div>
        </div>

        {/* Security - Password Change */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-accent-500" />
            <h2 className="font-bold text-navy-900">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field max-w-sm"
                disabled={passwordLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field max-w-sm"
                disabled={passwordLoading}
              />
            </div>
            <button
              type="submit"
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-accent-500" />
            <h2 className="font-bold text-navy-900">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'attendance', label: 'Attendance Alerts', desc: 'Receive alerts when attendance is marked or missed' },
              { key: 'fees', label: 'Fee Reminders', desc: 'Get notified about upcoming and overdue fee payments' },
              { key: 'notices', label: 'Notice Board', desc: 'Receive new notices and announcements' },
              { key: 'grades', label: 'Grade Updates', desc: 'Notifications when new marks are published' },
              { key: 'sms', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS to registered mobile' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-navy-900">{n.label}</div>
                  <div className="text-xs text-slate-400">{n.desc}</div>
                </div>
                <button
                  onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifications[n.key as keyof typeof notifications] ? 'bg-accent-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications[n.key as keyof typeof notifications] ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-accent-500" />
            <h2 className="font-bold text-navy-900">Display & Language</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Language</label>
              <select className="input-field">
                <option>English</option>
                <option>Tamil</option>
                <option>Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Date Format</label>
              <select className="input-field">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-accent-500" />
            <h2 className="font-bold text-navy-900">Data & Privacy</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary text-sm flex items-center gap-2">
              <Database size={14} />
              Export My Data
            </button>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <Globe size={14} />
              Privacy Policy
            </button>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
