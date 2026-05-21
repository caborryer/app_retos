'use client';

import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { cn } from '@/lib/utils';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import LocationConsentPrompt from '@/components/location/LocationConsentPrompt';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  brandLogoSrc?: string;
  brandLogoAlt?: string;
  brandTitle?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showBottomNav?: boolean;
  className?: string;
}

export default function Layout({
  children,
  title,
  brandLogoSrc,
  brandLogoAlt,
  brandTitle,
  showBack = false,
  showNotifications = true,
  showBottomNav = true,
  className,
}: LayoutProps) {
  useNotificationSync();

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        title={title}
        brandLogoSrc={brandLogoSrc}
        brandLogoAlt={brandLogoAlt}
        brandTitle={brandTitle}
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
      <LocationConsentPrompt />
    </div>
  );
}

