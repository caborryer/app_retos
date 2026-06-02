'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AdminLayoutSkeleton } from '@/components/admin/AdminSkeleton';
import { Menu } from 'lucide-react';
import BoxChallengeLogo from '@/components/brand/BoxChallengeLogo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      if (isLoginPage) return;
      router.replace('/admin/login');
      return;
    }

    if (session?.user?.role !== 'ADMIN' && !isLoginPage) {
      router.replace('/home');
      return;
    }

    if (session?.user?.role === 'ADMIN' && isLoginPage) {
      router.replace('/admin');
    }
  }, [status, session, isLoginPage, router]);

  if (status === 'loading') {
    return <AdminLayoutSkeleton />;
  }

  if (isLoginPage) return <>{children}</>;

  if (!session || session.user?.role !== 'ADMIN') {
    return <AdminLayoutSkeleton />;
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white transition-colors shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <BoxChallengeLogo className="h-8 w-8 shrink-0" />
            <span className="text-white font-bold text-sm truncate">BOX Challenge</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
