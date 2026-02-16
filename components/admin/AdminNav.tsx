'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Calendar,
  ShoppingBag,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Media', href: '/admin/media', icon: ImageIcon },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Shop', href: '/admin/shop', icon: ShoppingBag },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== '/admin' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-slate-200/90 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}
            `}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
