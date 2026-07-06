import type { Metadata, Viewport } from 'next';
import { Sora, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import AuthGate from '@/components/AuthGate';
import PwaSetup from '@/components/PwaSetup';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono' });

export const metadata: Metadata = {
  title: 'Vacatures',
  description: 'Persoonlijk job search dashboard',
  manifest: `${BASE_PATH}/manifest.json`,
  icons: { icon: `${BASE_PATH}/icons/icon-192.png`, apple: `${BASE_PATH}/icons/icon-192.png` },
};

export const viewport: Viewport = {
  themeColor: '#0e0e10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sora.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen antialiased">
        <PwaSetup />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
