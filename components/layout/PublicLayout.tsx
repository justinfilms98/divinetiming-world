'use client';

import { usePathname } from 'next/navigation';
import { SpaceBackdrop } from '@/components/space/SpaceBackdrop';
import { CornerNav } from '@/components/layout/CornerNav';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/motion/PageTransition';
import { CartProvider } from '@/components/shop/CartContext';
import { CartTrigger } from '@/components/shop/CartTrigger';
import { CartSlideOut } from '@/components/shop/CartSlideOut';
import { OverflowDebug } from '@/components/dev/OverflowDebug';
import type { SiteSettings } from '@/lib/types/content';

interface PublicLayoutProps {
  children: React.ReactNode;
  siteSettings?: SiteSettings | null;
}

export function PublicLayout({ children, siteSettings }: PublicLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname === '/login';

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <OverflowDebug />
      <SpaceBackdrop />
      <CornerNav siteSettings={siteSettings} />
      <div className="w-full max-w-[100vw] overflow-x-clip min-w-0 flex flex-col min-h-screen">
        <PageTransition className="flex-1 flex flex-col min-h-0">{children}</PageTransition>
        <Footer siteSettings={siteSettings} />
      </div>
      <CartTrigger />
      <CartSlideOut />
    </CartProvider>
  );
}
