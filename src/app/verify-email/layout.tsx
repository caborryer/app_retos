import { Suspense } from 'react';
import AppLoadingScreen from '@/components/brand/AppLoadingScreen';

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AppLoadingScreen />}>{children}</Suspense>;
}
