'use client';

import { Home, Trophy, Calendar, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TabType } from '@/types';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  tab: TabType;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/', tab: 'home' },
  { icon: Trophy, label: 'Retos', path: '/challenges', tab: 'challenges' },
  { icon: Calendar, label: 'Actividad', path: '/activity', tab: 'activity' },
  { icon: User, label: 'Perfil', path: '/profile', tab: 'profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useAppStore();

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-secondary-200 safe-area-bottom">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => handleTabClick(item.tab)}
              className="relative flex flex-col items-center gap-1 px-4 py-2 min-w-[64px]"
            >
              <motion.div
                className={cn(
                  'relative transition-colors duration-200',
                  isActive ? 'text-primary-500' : 'text-secondary-500'
                )}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className="w-6 h-6" />
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>

              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-primary-500' : 'text-secondary-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

