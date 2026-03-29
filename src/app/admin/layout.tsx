'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const isLoginPage = pathname === '/admin/login';

    const runGuard = () => {
      // Read directly from the store (avoids stale subscription timing)
      const { currentUser } = useAppStore.getState();
      const adminOk = !!(currentUser && currentUser.role === 'admin');

      if (!adminOk && !isLoginPage) {
        router.replace('/admin/login');
      } else if (adminOk && isLoginPage) {
        router.replace('/admin');
      }

      setIsAuthorized(adminOk);
      setReady(true);
    };

    // Wait for Zustand persist to finish rehydrating from localStorage
    if (useAppStore.persist.hasHydrated()) {
      runGuard();
    } else {
      const unsub = useAppStore.persist.onFinishHydration(runGuard);
      return unsub;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Show spinner until Zustand has hydrated and guard has run
  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Render login page without sidebar layout
  const isLoginPage = pathname === '/admin/login';
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Guard: not authorized — redirect is in progress, show nothing
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">Panel Administrativo</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
