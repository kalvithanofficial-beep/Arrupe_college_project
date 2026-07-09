import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Plus, Trash2, Search, AlertCircle, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, UserFormData } from '../contexts/AuthContext';
import { UserRole } from '../types';
import UserFormModal from '../components/UserFormModal';

interface UserRecord extends UserFormData {
  id: string;
  created_at?: string;
}

const ROLE_BADGES: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  accountant: 'bg-green-100 text-green-700',
  parent: 'bg-indigo-100 text-indigo-700',
  student: 'bg-slate-100 text-slate-700',
};

export default function UsersPage() {
  const { role, createUserByAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determine which roles to manage based on user role
  const manageable_roles = useMemo<UserRole[]>(() => {
    switch (role) {
      case 'admin':
        return ['teacher', 'accountant', 'student', 'parent'];
      case 'teacher':
        return ['student'];
      case 'accountant':
        return [];
      default:
        return [];
    }
  }, [role]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

    if (manageable_roles.length > 0) {
      query.in('role', manageable_roles);
    }

    const { data, error: err } = await query;
    setUsersLoading(false);

    if (err) {
      setError('Failed to load users');
      return;
    }

    setUsers(data || []);
  }, [manageable_roles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateUser(formData: UserFormData) {
    try {
      setError('');
      const { error: err } = await createUserByAdmin(formData);

      if (err) {
        throw err;
      }

      setSuccess(`User ${formData.first_name} ${formData.last_name} created successfully!`);
      setShowModal(false);
      setEditingUser(null);
      setTimeout(() => setSuccess(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError((err as Error).message || 'Failed to create user.');
    }
  }

  async function handleUpdateUser(userId: string, formData: UserFormData) {
    try {
      setError('');
      const updatePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        religion: formData.religion || null,
        role: formData.role,
      };

      const { error: err } = await supabase.from('profiles').update(updatePayload).eq('id', userId);

      if (err) {
        throw err;
      }

      setSuccess(`User ${formData.first_name} ${formData.last_name} updated successfully!`);
      setShowModal(false);
      setEditingUser(null);
      setTimeout(() => setSuccess(''), 3000);
      await fetchUsers();
    } catch (err) {
      setError((err as Error).message || 'Failed to update user.');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const { error: err } = await supabase.from('profiles').delete().eq('id', userId);

    if (err) {
      setError('Failed to delete user');
      return;
    }

    setSuccess('User deleted successfully!');
    setTimeout(() => setSuccess(''), 3000);
    await fetchUsers();
  }

  function handleEditUser(user: UserRecord) {
    setEditingUser(user);
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function openCreateModal() {
    setEditingUser(null);
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingUser(null);
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'all' || u.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-sm">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-accent-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!manageable_roles.length) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-sm">
          <AlertCircle size={32} className="text-slate-400 mx-auto mb-3" />
          <h2 className="font-bold text-slate-700 mb-2">No Access</h2>
          <p className="text-slate-500 text-sm">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          ✓ {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-accent-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900">User Management</h1>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add New User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {manageable_roles.map(r => {
          const count = users.filter(u => u.role === r).length;
          return (
            <div key={r} className="card p-4">
              <div className="text-2xl font-bold text-navy-900">{count}</div>
              <div className="text-sm text-slate-500 capitalize">{r}s</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>

          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value as UserRole | 'all')}
            className="input-field"
          >
            <option value="all">All Roles</option>
            {manageable_roles.map(r => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>

          <div className="text-sm text-slate-500 flex items-center">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      {usersLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-accent-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card p-8 text-center">
          <Users size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No users found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Gender</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-navy-900">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.age}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`badge ${ROLE_BADGES[u.role] || 'bg-slate-100 text-slate-700'}`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.gender}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="text-slate-500 hover:text-slate-700 transition-colors"
                        title="Edit user"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={editingUser ? (formData => handleUpdateUser(editingUser.id, formData)) : handleCreateUser}
        title={editingUser ? 'Edit User' : role === 'teacher' ? 'Add New Student' : 'Create New User'}
        submitButtonText={editingUser ? 'Save Changes' : 'Send Invitation'}
        initialData={editingUser ?? undefined}
        isEdit={Boolean(editingUser)}
        allowedRoles={manageable_roles}
      />
    </div>
  );
}
