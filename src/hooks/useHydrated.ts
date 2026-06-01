'use client';

import { useEffect, useState } from 'react';

/** True after mount — keeps SSR and first client paint aligned before session-dependent UI. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
