import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { getSiteContent } from '@/lib/api';
import { ToastProvider } from '@/context/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import DevModeInitializer from '@/components/DevModeInitializer';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent().catch(() => ({} as Record<string, string>));
  return {
    title: content.meta_title || 'NAGARTA Youth Camp 2026 — Arise & Lead',
    description: content.meta_description || 'A transformative 5-day leadership camp. 19–23 December 2026, Accra, Ghana.',
    openGraph: {
      title: content.meta_title || 'NAGARTA Youth Camp 2026',
      description: content.meta_description || 'Arise & Lead. A transformative 5-day experience.',
      type: 'website',
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <ToastProvider>
          <DevModeInitializer />
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
