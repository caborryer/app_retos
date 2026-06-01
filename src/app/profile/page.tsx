'use client';

import { useEffect, useState, type ComponentType } from 'react';
import AppLoadingScreen from '@/components/brand/AppLoadingScreen';

export default function ProfilePage() {
  const [Page, setPage] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('./ProfilePageClient')
      .then((mod) => {
        if (!cancelled) setPage(() => mod.default);
      })
      .catch((err) => {
        console.error('[profile] failed to load ProfilePageClient', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Page) {
    return <AppLoadingScreen />;
  }

  return <Page />;
}
