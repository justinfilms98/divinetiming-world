import './globals.css';
import type { Metadata } from 'next';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Playfair_Display, Inter } from 'next/font/google';
import { getSiteSettings } from '@/lib/content/server';

const playfairDisplay = Playfair_Display({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
});

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const SITE_NAME = 'Divine Timing';
const DEFAULT_DESCRIPTION = 'Live, evolving, in motion.';
const BASE_URL =
  typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://divinetiming.world';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'DIVINE:TIMING',
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: 'DIVINE:TIMING',
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    images: [{ url: '/opengraph.png', width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIVINE:TIMING',
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`min-h-screen antialiased ${playfairDisplay.variable} ${inter.variable}`} suppressHydrationWarning>
        <PublicLayout siteSettings={siteSettings}>{children}</PublicLayout>
      </body>
    </html>
  );
}
