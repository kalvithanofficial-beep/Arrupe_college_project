import { useState } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, User, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  accountant: 'Chief Accountant',
  parent: 'Parent',
  student: 'Student',
};

interface HeaderProps {
  title?: string;
  onToggleSidebar: () => void;
}

export default function Header({ title, onToggleSidebar }: HeaderProps) {
  const { profile, role, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleLabel = role ? ROLE_LABELS[role] ?? role : '';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
      <button
        type="button"
        className="inline-flex items-center justify-center p-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-navy-900 transition-colors md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              role === 'accountant' ? 'Search invoices...' :
              role === 'parent' ? 'Search records...' :
              'Search records, staff, students...'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
          />
        </div>
      </div>

      {title && (
        <div className="hidden xl:block text-sm font-semibold text-navy-900 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
          {title}
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative p-2 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors">
          <HelpCircle size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center">
              <User size={14} className="text-accent-600" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-navy-900 leading-tight">
                {profile?.full_name || roleLabel}
              </div>
              <div className="text-xs text-slate-400 leading-tight">
                {profile?.email || `${role}@arrupecollege.edu`}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold text-navy-900">{profile?.full_name || roleLabel}</div>
                  <div className="text-xs text-slate-500 capitalize">{roleLabel}</div>
                </div>
                <button
                  onClick={() => { setShowDropdown(false); signOut(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
