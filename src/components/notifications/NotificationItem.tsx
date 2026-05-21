'use client';

import { motion } from 'framer-motion';
import { Bell, Trophy, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'challenge':
        return <Trophy className="w-5 h-5 text-primary-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    if (!notification.read) {
      return 'bg-primary-500/10 border-primary-500/40';
    }
    return 'bg-slate-800/80 border-slate-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'relative p-4 border-l-4 rounded-lg transition-all duration-200',
        getBackgroundColor()
      )}
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-700 transition-colors"
        aria-label="Eliminar notificación"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>

      <div
        className="flex items-start gap-3 pr-6 cursor-pointer"
        onClick={() => !notification.read && onMarkAsRead(notification.id)}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'text-sm font-semibold mb-1',
              notification.read ? 'text-slate-400' : 'text-white'
            )}
          >
            {notification.title}
          </h4>
          <p
            className={cn(
              'text-sm mb-2',
              notification.read ? 'text-slate-500' : 'text-slate-300'
            )}
          >
            {notification.message}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {formatRelativeTime(notification.timestamp)}
            </span>
            {!notification.read && (
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
