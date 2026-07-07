'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, roleLabel } from '@/lib/auth-context';
import { DashboardSidebar } from './sidebar';
import { NoticeBoard } from './notice-board';
import { CriticalBanner } from './critical-banner';
import { Loader2 } from 'lucide-react';

interface DashboardShellProps {
  role: string;
  children: (activeSection: string) => React.ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.replace('/');
        return;
      }
      if (profile.role !== role) {
        router.replace(`/dashboard/${profile.role}`);
      }
    }
  }, [loading, user, profile, role, router]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D95D16]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-[#E5E7EB] px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="ml-12 lg:ml-0">
              <h1 className="text-xl font-bold text-[#0F2942] capitalize">
                {activeSection === 'overview'
                  ? `${roleLabel(profile.role)} Dashboard`
                  : activeSection.replace('-', ' ')}
              </h1>
              <p className="text-xs text-[#0F2942]/60 hidden sm:block">
                ARRUPE College, Batticaloa - Portal | Welcome back, {profile.full_name}
              </p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-8">
          <CriticalBanner />
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 min-w-0 animate-fade-up">{children(activeSection)}</div>
            <div className="xl:w-80 flex-shrink-0">
              <NoticeBoard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
