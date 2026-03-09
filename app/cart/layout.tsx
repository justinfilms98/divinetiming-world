import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your Divine Timing cart.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
