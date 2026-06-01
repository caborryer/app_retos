'use client';

import { useEffect, useState, type ComponentType } from 'react';
import AppLoadingScreen from '@/components/brand/AppLoadingScreen';

export default function HomePage() {
  const [Page, setPage] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('./HomePageClient')
      .then((mod) => {
        if (!cancelled) setPage(() => mod.default);
      })
      .catch((err) => {
        console.error('[home] failed to load HomePageClient', err);
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
