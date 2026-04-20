'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Image,
  LayoutGrid,
  BarChart2,
  LogOut,
  Zap,
  ChevronRight,
  X,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/submissions',
    label: 'Envíos',
    icon: Image,
    exact: false,
  },
  {
    href: '/admin/boards',
    label: 'Tableros',
    icon: LayoutGrid,
    exact: false,
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart2,
    exact: false,
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser = session?.user;

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push('/login');
  }

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const sidebarContent = (
    <aside className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-500 shadow-lg shadow-primary-500/30 shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">Sport Challenge</p>
          <p className="text-primary-400 text-xs">Panel Admin</p>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-400' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-primary-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        {currentUser && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
              <span className="text-primary-400 text-xs font-bold">
                {(currentUser.name ?? 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{currentUser.name}</p>
              <p className="text-slate-500 text-xs truncate">{currentUser.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
