import {
  GraduationCap, LayoutDashboard, BookOpen, DollarSign, Users,
  CalendarCheck, Settings, LogOut, HelpCircle, Download, FileText,
  BarChart2, Bell, UserCircle, Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  page: string;
  restricted?: boolean;
  divider?: boolean;
}

function getNavItems(role: UserRole | null): { items: NavItem[]; restricted: NavItem[] } {
  switch (role) {
    case 'admin':
      return {
        items: [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, page: 'dashboard' },
          { label: 'Academic', icon: <BookOpen size={18} />, page: 'academic' },
          { label: 'Financials', icon: <DollarSign size={18} />, page: 'financial' },
          { label: 'Users', icon: <Users size={18} />, page: 'users' },
          { label: 'Attendance', icon: <CalendarCheck size={18} />, page: 'attendance' },
          { label: 'Notices', icon: <Bell size={18} />, page: 'notices' },
          { label: 'Settings', icon: <Settings size={18} />, page: 'settings' },
        ],
        restricted: [],
      };
    case 'teacher':
      return {
        items: [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, page: 'dashboard' },
          { label: 'Academic', icon: <BookOpen size={18} />, page: 'academic' },
          { label: 'Attendance', icon: <CalendarCheck size={18} />, page: 'attendance' },
          { label: 'Students', icon: <Users size={18} />, page: 'users' },
          { label: 'Notices', icon: <Bell size={18} />, page: 'notices' },
          { label: 'Settings', icon: <Settings size={18} />, page: 'settings' },
        ],
        restricted: [],
      };
    case 'accountant':
      return {
        items: [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, page: 'dashboard' },
          { label: 'Invoices', icon: <FileText size={18} />, page: 'financial' },
          { label: 'Settings', icon: <Settings size={18} />, page: 'settings' },
        ],
        restricted: [
          { label: 'Academic', icon: <BookOpen size={18} />, page: 'academic', restricted: true },
          { label: 'Reports', icon: <BarChart2 size={18} />, page: 'reports', restricted: true },
        ],
      };
    case 'parent':
      return {
        items: [
          { label: 'Dashboard', icon: <Home size={18} />, page: 'dashboard' },
          { label: 'Academic', icon: <BookOpen size={18} />, page: 'academic' },
          { label: 'Financials', icon: <DollarSign size={18} />, page: 'financial' },
          { label: 'Notices', icon: <Bell size={18} />, page: 'notices' },
          { label: 'Staff', icon: <Users size={18} />, page: 'users' },
          { label: 'Profile', icon: <UserCircle size={18} />, page: 'settings' },
        ],
        restricted: [],
      };
    case 'student':
      return {
        items: [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, page: 'dashboard' },
          { label: 'Academic', icon: <BookOpen size={18} />, page: 'academic' },
          { label: 'Attendance', icon: <CalendarCheck size={18} />, page: 'attendance' },
          { label: 'Financials', icon: <DollarSign size={18} />, page: 'financial' },
          { label: 'Notices', icon: <Bell size={18} />, page: 'notices' },
          { label: 'Settings', icon: <Settings size={18} />, page: 'settings' },
        ],
        restricted: [],
      };
    default:
      return { items: [{ label: 'Dashboard', icon: <LayoutDashboard size={18} />, page: 'dashboard' }], restricted: [] };
  }
}

const ROLE_SUBTITLES: Record<string, string> = {
  admin: 'School Management',
  teacher: 'Academic Management',
  accountant: 'Financial Portal',
  parent: 'Parent Portal',
  student: 'Student Portal',
};

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { role, signOut, profile } = useAuth();

  const { items, restricted } = getNavItems(role);
  const subtitle = role ? ROLE_SUBTITLES[role] : 'School Management';

  return (
    <aside className="w-[260px] bg-navy-900 flex flex-col h-screen sticky top-0 shrink-0 shadow-xl">
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <GraduationCap className="text-white" size={20} />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide leading-tight">ARRUPE COLLEGE</div>
            <div className="text-slate-400 text-xs">{subtitle}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {items.map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`sidebar-link w-full ${currentPage === item.page ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {restricted.length > 0 && (
          <div className="pt-4">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Restricted</div>
            {restricted.map(item => (
              <div
                key={item.page}
                className="sidebar-link w-full opacity-40 cursor-not-allowed select-none"
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* User info */}
      {profile && (
        <div className="px-3 py-2 mx-3 mb-2 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{profile.full_name || 'User'}</div>
              <div className="text-slate-400 text-xs capitalize">{profile.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        {role === 'admin' && (
          <button
            onClick={() => onNavigate('backup')}
            className="sidebar-link w-full bg-accent-500/20 text-accent-300 hover:bg-accent-500/30"
          >
            <Download size={15} />
            <span className="text-xs font-semibold">Download Backup</span>
          </button>
        )}
        <button onClick={() => onNavigate('support')} className="sidebar-link w-full">
          <HelpCircle size={16} />
          System Support
        </button>
        <button onClick={signOut} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
