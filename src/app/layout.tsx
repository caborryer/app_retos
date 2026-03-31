import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

const dmSans = DM_Sans({ subsets: ['latin'] });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BingoChallenge - Retos Deportivos',
  description: 'Participa en retos deportivos, alcanza tus metas y compite con amigos',
  manifest: '/manifest.json',
  themeColor: '#FC0230',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BingoChallenge',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

