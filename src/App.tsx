import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/layout/Layout';

// Admin / Teacher / Accountant pages
import AdminDashboard from './pages/AdminDashboard';
import AcademicDashboard from './pages/AcademicDashboard';
import FinancialDashboard from './pages/FinancialDashboard';
import UsersPage from './pages/UsersPage';
import AttendancePage from './pages/AttendancePage';
import SettingsPage from './pages/SettingsPage';
import NoticesPage from './pages/NoticesPage';

// Parent pages
import ParentDashboard from './pages/ParentDashboard';
import ParentAcademic from './pages/ParentAcademic';
import ParentFinancials from './pages/ParentFinancials';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import StudentPerformance from './pages/StudentPerformance';

import { GraduationCap } from 'lucide-react';

type Page = string;

function getDefaultPage(): Page {
  return 'dashboard';
}

function AppContent() {
  const { user, role, loading } = useAuth();
  const [page, setPage] = useState<Page>(getDefaultPage);

  const pathname = window.location.pathname;

  if (pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <div className="text-slate-400 text-sm mt-3">Loading Arrupe College...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  function renderPage() {
    switch (role) {
      // ─── ADMIN ───────────────────────────────────────────────────
      case 'admin':
        switch (page) {
          case 'academic': return <AcademicDashboard />;
          case 'financial': return <FinancialDashboard />;
          case 'users': return <UsersPage />;
          case 'attendance': return <AttendancePage />;
          case 'notices': return <NoticesPage />;
          case 'settings': return <SettingsPage />;
          case 'backup': return <BackupPage />;
          case 'support': return <SupportPage />;
          default: return <AdminDashboard />;
        }

      // ─── TEACHER ─────────────────────────────────────────────────
      case 'teacher':
        switch (page) {
          case 'academic': return <AcademicDashboard />;
          case 'attendance': return <AttendancePage />;
          case 'users': return <UsersPage />;
          case 'notices': return <NoticesPage />;
          case 'settings': return <SettingsPage />;
          case 'backup': return <BackupPage />;
          case 'support': return <SupportPage />;
          default: return <AcademicDashboard />;
        }

      // ─── ACCOUNTANT ──────────────────────────────────────────────
      case 'accountant':
        switch (page) {
          case 'financial': return <FinancialDashboard />;
          case 'settings': return <SettingsPage />;
          case 'backup': return <BackupPage />;
          case 'support': return <SupportPage />;
          default: return <FinancialDashboard />;
        }

      // ─── PARENT ──────────────────────────────────────────────────
      case 'parent':
        switch (page) {
          case 'academic': return <ParentAcademic />;
          case 'financial': return <ParentFinancials />;
          case 'notices': return <NoticesPage />;
          case 'users': return <UsersPage />;
          case 'settings': return <SettingsPage />;
          case 'backup': return <BackupPage />;
          case 'support': return <SupportPage />;
          default: return <ParentDashboard />;
        }

      // ─── STUDENT ─────────────────────────────────────────────────
      case 'student':
        switch (page) {
          case 'academic': return <StudentPerformance />;
          case 'attendance': return <AttendancePage />;
          case 'financial': return <ParentFinancials />;
          case 'notices': return <NoticesPage />;
          case 'settings': return <SettingsPage />;
          case 'backup': return <BackupPage />;
          case 'support': return <SupportPage />;
          default: return <StudentDashboard />;
        }

      default:
        return <AdminDashboard />;
    }
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

function BackupPage() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="card p-10 text-center max-w-sm">
        <div className="w-14 h-14 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={26} className="text-accent-600" />
        </div>
        <h2 className="font-bold text-navy-900 text-xl mb-2">Monthly Backup</h2>
        <p className="text-slate-500 text-sm mb-5">Your backup is ready. Download the full system export for this month.</p>
        <button className="btn-primary w-full">Download Backup (.zip)</button>
      </div>
    </div>
  );
}

function SupportPage() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="card p-8 max-w-lg w-full">
        <h2 className="font-bold text-navy-900 text-xl mb-1">System Support</h2>
        <p className="text-slate-500 text-sm mb-5">Contact the Arrupe College IT team for assistance.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Issue Type</label>
            <select className="input-field">
              <option>Login / Access Issue</option>
              <option>Data Entry Error</option>
              <option>Feature Request</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea rows={4} placeholder="Describe your issue in detail..." className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(p => (
                <button key={p} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:border-accent-400 hover:text-accent-600 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full">Submit Support Ticket</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
