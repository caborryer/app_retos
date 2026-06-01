'use client';

import { useEffect, useState, type ComponentType } from 'react';
import AppLoadingScreen from '@/components/brand/AppLoadingScreen';

export default function ActivityPage() {
  const [Page, setPage] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('./ActivityPageClient')
      .then((mod) => {
        if (!cancelled) setPage(() => mod.default);
      })
      .catch((err) => {
        console.error('[activity] failed to load ActivityPageClient', err);
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
