'use client';

import { usePathname } from 'next/navigation';
import { SpaceBackdrop } from '@/components/space/SpaceBackdrop';
import { CornerNav } from '@/components/layout/CornerNav';
import { SocialDock } from '@/components/layout/SocialDock';
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
    <>
      <SpaceBackdrop />
      <CornerNav />
      <SocialDock siteSettings={siteSettings} />
      {children}
    </>
  );
}
