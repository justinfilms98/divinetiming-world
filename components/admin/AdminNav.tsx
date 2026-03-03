'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Calendar,
  ShoppingBag,
  Settings,
  Layers,
  FileText,
  BookOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Booking', href: '/admin/booking', icon: BookOpen },
  { label: 'Media', href: '/admin/media', icon: ImageIcon },
  { label: 'Shop', href: '/admin/shop', icon: ShoppingBag },
  { label: 'Heroes', href: '/admin#heroes', icon: Layers },
  { label: 'About', href: '/admin/about', icon: FileText },
] as const;

interface AdminNavProps {
  collapsed?: boolean;
}

export function AdminNav({ collapsed }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href.startsWith('/admin#') && pathname === '/admin') ||
          (item.href !== '/admin' && !item.href.startsWith('/admin#') && pathname?.startsWith(item.href));
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-w-0
              ${collapsed ? 'justify-center' : ''}
              ${isActive ? 'bg-slate-200/90 text-slate-900 ring-1 ring-slate-300/50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
