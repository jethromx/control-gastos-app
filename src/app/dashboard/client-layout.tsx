'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '../../presentation/components/layout/sidebar';
import { ToastProvider } from '../../presentation/components/ui/toast-provider';

interface Props {
  children: React.ReactNode;
  isAdmin: boolean;
  userName: string;
}

export function DashboardClientLayout({ children, isAdmin, userName }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-[#F4F6FB]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar isAdmin={isAdmin} userName={userName} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-50 flex w-64 flex-col">
              <Sidebar isAdmin={isAdmin} userName={userName} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[#F4F6FB]">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm px-4 py-3 md:hidden sticky top-0 z-10 shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-base font-semibold text-slate-900">InversionTracker</span>
          </div>
          <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
