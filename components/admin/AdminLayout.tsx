'use client';

import { AdminShell } from '@/components/admin/AdminShell';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
