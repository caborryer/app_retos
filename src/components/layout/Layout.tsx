'use client';

import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showBottomNav?: boolean;
  className?: string;
}

export default function Layout({
  children,
  title,
  showBack = false,
  showNotifications = true,
  showBottomNav = true,
  className,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-white">
      <Header
        title={title}
        showBack={showBack}
        showNotifications={showNotifications}
      />
      
      <main
        className={cn(
          'pt-[120px] pb-24 px-6 max-w-md mx-auto',
          className
        )}
      >
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

