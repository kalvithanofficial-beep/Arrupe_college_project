import { FormEvent, useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserFormData } from '../contexts/AuthContext';
import { UserRole } from '../types';

type UserFormInputState = Omit<UserFormData, 'age'> & { age: string };

export interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: UserFormData) => Promise<void>;
  title: string;
  submitButtonText?: string;
  allowedRoles?: UserRole[];
  initialData?: UserFormData;
  isEdit?: boolean;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText = 'Create User',
  initialData,
  isEdit = false,
  allowedRoles = ['student', 'teacher', 'accountant', 'admin'],
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormInputState>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    age: initialData?.age ? String(initialData.age) : '',
    gender: initialData?.gender || 'Male',
    date_of_birth: initialData?.date_of_birth || '',
    address: initialData?.address || '',
    religion: initialData?.religion || '',
    role: initialData?.role || allowedRoles[0] || 'student',
    password: initialData?.password || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      age: initialData?.age ? String(initialData.age) : '',
      gender: initialData?.gender || 'Male',
      date_of_birth: initialData?.date_of_birth || '',
      address: initialData?.address || '',
      religion: initialData?.religion || '',
      role: initialData?.role || allowedRoles[0] || 'student',
      password: initialData?.password || '',
    });
  }, [initialData, allowedRoles, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 1. Strict Form Validations
    if (!formData.first_name || !formData.first_name.trim()) { setError('First name is required'); return; }
    if (!formData.last_name || !formData.last_name.trim()) { setError('Last name is required'); return; }
    if (!formData.email.trim()) { setError('Email is required'); return; }
    if (!formData.password || !formData.password.trim()) { setError('Password is required'); return; }
    if (!formData.phone.trim()) { setError('Mobile number is required'); return; }
    if (!formData.age.trim()) { setError('Age is required'); return; }
    if (!formData.date_of_birth) { setError('Date of birth is required'); return; }
    if (!formData.address.trim()) { setError('Address is required'); return; }
    if (!formData.religion.trim()) { setError('Religion is required'); return; }

    setLoading(true);
    try {
      console.log('Submitting admin user creation form...', formData);
      await onSubmit({
        ...formData,
        age: Number(formData.age),
      });
      setSuccessMessage('Success! The user profile has been safely created.');

      // 3. Clear Form Fields
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        age: '',
        gender: 'Male',
        date_of_birth: '',
        address: '',
        religion: '',
        role: allowedRoles[0] || 'student',
        password: '',
      });

    } catch (err) {
      console.error('Caught Form Submission Error:', err);
      setError((err as Error).message || 'Failed to onboard the user.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl z-50 overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-navy-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <CheckCircle2 size={20} className="mt-0.5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">Success!</p>
                <p className="text-sm text-emerald-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Password field added for admin-created initial password */}

          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="input-field"
                placeholder="John"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="input-field"
                placeholder="Doe"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="john@example.com"
                disabled={loading || isEdit}
                readOnly={isEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+91 98765 43210"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Row */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="Set an initial password"
              disabled={loading || isEdit}
              required
              autoComplete={isEdit ? 'new-password' : 'new-password'}
            />
          </div>

          {/* Age & Gender Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Age *</label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="input-field"
                placeholder="18"
                min="1"
                max="120"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender *</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as UserFormInputState['gender'] })}
                className="input-field"
                disabled={loading}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Date of Birth & Religion Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Religion *</label>
              <input
                type="text"
                value={formData.religion}
                onChange={e => setFormData({ ...formData, religion: e.target.value })}
                className="input-field"
                placeholder="Catholic"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address Full Width */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address *</label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="input-field resize-none"
              placeholder="Enter full address"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="input-field"
              disabled={loading}
            >
              {allowedRoles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Sending...' : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
