'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bell, ChevronLeft, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import NotificationPanel from '../notifications/NotificationPanel';
import BoxChallengeLogo, { isBoxChallengeLogoSrc } from '@/components/brand/BoxChallengeLogo';

interface HeaderProps {
  title?: string;
  brandLogoSrc?: string;
  brandLogoAlt?: string;
  brandTitle?: string;
  showBack?: boolean;
  showNotifications?: boolean;
}

export default function Header({
  title,
  brandLogoSrc,
  brandLogoAlt = 'Box Challenge',
  brandTitle = 'BOX Challenge',
  showBack = false,
  showNotifications = true,
}: HeaderProps) {
  const router = useRouter();
  const { unreadCount } = useAppStore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={() => router.back()}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-slate-200" />
                </button>
              )}

              {brandLogoSrc && (
                <div className="flex items-center gap-1 min-w-0">
                  {isBoxChallengeLogoSrc(brandLogoSrc) ? (
                    <BoxChallengeLogo className="h-9 w-9 shrink-0" />
                  ) : (
                    <Image
                      src={brandLogoSrc}
                      alt={brandLogoAlt}
                      width={200}
                      height={72}
                      className="h-9 w-auto max-h-9 shrink-0 object-contain object-left"
                      sizes="(max-width: 640px) 72px, 88px"
                      priority
                    />
                  )}
                  {brandTitle ? (
                    <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none truncate">
                      {brandTitle}
                    </span>
                  ) : null}
                </div>
              )}
              {!brandLogoSrc && title && (
                <h1 className="text-2xl font-bold text-white">{title}</h1>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push('/profile/settings')}
                className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                aria-label="Ir a configuración del perfil"
                title="Configuración"
              >
                <Settings className="w-5 h-5 text-slate-300" />
              </button>

              {showNotifications && (
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="relative p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-6 h-6 text-slate-300" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
