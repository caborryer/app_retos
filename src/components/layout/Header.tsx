'use client';

import { useState } from 'react';
import { Bell, ChevronLeft, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import NotificationPanel from '../notifications/NotificationPanel';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
}

export default function Header({
  title,
  showBack = false,
  showNotifications = true,
}: HeaderProps) {
  const router = useRouter();
  const { unreadCount } = useAppStore();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-white to-white/95 backdrop-blur-sm">
        {/* Main Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={() => router.back()}
                  className="p-2 -ml-2 rounded-full hover:bg-secondary-100 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-secondary-900" />
                </button>
              )}
              
              {title && (
                <h1 className="text-2xl font-bold text-secondary-900">
                  {title}
                </h1>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push('/profile/settings')}
                className="p-2 rounded-full hover:bg-secondary-100 transition-colors"
                aria-label="Ir a configuración del perfil"
                title="Configuración"
              >
                <Settings className="w-5 h-5 text-secondary-900" />
              </button>

              {showNotifications && (
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="relative p-2 -mr-2 rounded-full hover:bg-secondary-100 transition-colors"
                >
                  <Bell className="w-6 h-6 text-secondary-900" />
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

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}
