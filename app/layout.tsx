import './globals.css';
import type { Metadata } from 'next';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Playfair_Display } from 'next/font/google';
import { getSiteSettings } from '@/lib/content';

const playfairDisplay = Playfair_Display({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'DIVINE:TIMING',
  description: 'Live, evolving, in motion.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <html lang="en">
      <body className={`min-h-screen antialiased ${playfairDisplay.variable}`} suppressHydrationWarning>
        <PublicLayout siteSettings={siteSettings}>{children}</PublicLayout>
      </body>
    </html>
  );
}
