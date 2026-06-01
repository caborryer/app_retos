'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import BoxChallengeLogo from '@/components/brand/BoxChallengeLogo';

type PublicBrandNavProps = {
  /** Right side: login button, links, etc. */
  children?: ReactNode;
  homeHref?: string;
};

export default function PublicBrandNav({ children, homeHref = '/' }: PublicBrandNavProps) {
  return (
    <nav className="flex items-center justify-between px-6 h-[60px] border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
      <Link
        href={homeHref}
        className="flex items-center gap-1 py-1 min-w-0"
        aria-label="Ir al inicio"
      >
        <BoxChallengeLogo className="h-9 w-9 shrink-0" />
        <span className="text-[15px] sm:text-base font-bold text-white tracking-tight truncate">
          BOX Challenge
        </span>
      </Link>
      {children ? <div className="flex items-center shrink-0">{children}</div> : null}
    </nav>
  );
}
