import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  headerTitle?: string;
}

export default function Layout({ children, currentPage, onNavigate, headerTitle }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={headerTitle} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
