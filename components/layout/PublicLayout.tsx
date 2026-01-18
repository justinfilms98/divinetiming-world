'use client';

import { usePathname } from 'next/navigation';
import { SpaceBackdrop } from '@/components/space/SpaceBackdrop';
import { CornerNav } from '@/components/layout/CornerNav';
import { SocialDock } from '@/components/layout/SocialDock';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname === '/login';

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SpaceBackdrop />
      <CornerNav />
      <SocialDock />
      {children}
    </>
  );
}
