'use client';

import { useState } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.back()}
                  className="p-2 -ml-2 rounded-full hover:bg-secondary-100 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-secondary-900" />
                </motion.button>
              )}
              
              {title && (
                <h1 className="text-2xl font-bold text-secondary-900">
                  {title}
                </h1>
              )}
            </div>

            {/* Right Side */}
            {showNotifications && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPanelOpen(true)}
                className="relative p-2 -mr-2 rounded-full hover:bg-secondary-100 transition-colors"
              >
                <Bell className="w-6 h-6 text-secondary-900" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </motion.div>
                )}
              </motion.button>
            )}
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
