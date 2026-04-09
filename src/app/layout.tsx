import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import { auth } from '@/auth';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // auth() can throw if secret/config is wrong or if Auth.js returns a
  // non-JSON redirect (e.g. assertConfig error). Catch so the layout never
  // crashes; the client-side SessionProvider will fetch the session instead.
  let session = null;
  try {
    session = await auth();
  } catch {
    // intentionally swallowed — session will be fetched client-side
  }

  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}

