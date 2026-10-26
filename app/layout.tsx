import './globals.css';
import type { Metadata } from 'next';
import { PublicLayout } from '@/components/layout/PublicLayout';
import localFont from 'next/font/local';
import { getSiteSettings } from '@/lib/content/server';
import { BASE_URL, SITE_NAME, DEFAULT_OG_IMAGE, IS_PRODUCTION_SITE } from '@/lib/site';

// Self-hosted (OFL) variable fonts, Latin subset. next/font/google fetches CSS from Google at
// build time, and Vercel builds failed when Google returned `/l/font?kit=…&skey=…` URLs that
// Turbopack's font loader rejects ("next/font/google queries have exactly one entry").
const playfairDisplay = localFont({
  src: [{ path: './fonts/PlayfairDisplay-Variable-latin.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-playfair-display',
  fallback: ['Georgia', 'serif'],
});

const inter = localFont({
  src: [{ path: './fonts/Inter-Variable-latin.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-body',
  fallback: ['system-ui', 'sans-serif'],
});

const DEFAULT_DESCRIPTION = 'Live, evolving, in motion.';

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
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Divine Timing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIVINE:TIMING',
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: IS_PRODUCTION_SITE ? { index: true, follow: true } : { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en">
      <body className={`min-h-screen antialiased ${playfairDisplay.variable} ${inter.variable}`} suppressHydrationWarning>
        <PublicLayout siteSettings={siteSettings}>{children}</PublicLayout>
      </body>
    </html>
  );
}
