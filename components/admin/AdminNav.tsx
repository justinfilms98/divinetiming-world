'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ImagePlay,
  CalendarDays,
  ShoppingBag,
  Settings2,
  Clapperboard,
  FileText,
  FolderOpen,
  Mail,
  Compass,
  Scale,
  UserCircle,
} from 'lucide-react';

/** Admin nav by content intent (charter: no DB abstractions). */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Homepage', href: '/admin/hero', icon: Clapperboard },
  { label: 'Events', href: '/admin/events', icon: CalendarDays },
  { label: 'Media Library', href: '/admin/media', icon: ImagePlay },
  { label: 'Collections', href: '/admin/collections', icon: FolderOpen },
  { label: 'Shop', href: '/admin/shop', icon: ShoppingBag },
  { label: 'Journey', href: '/admin/journey', icon: Compass },
  { label: 'Inquiries', href: '/admin/booking-inquiries', icon: Mail },
  { label: 'Press Kit', href: '/admin/presskit', icon: FileText },
  { label: 'About', href: '/admin/about', icon: UserCircle },
  { label: 'Legal Policies', href: '/admin/policies', icon: Scale },
  { label: 'Site Settings', href: '/admin/settings', icon: Settings2 },
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
          (item.href !== '/admin' && pathname?.startsWith(item.href));
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-w-0
              ${collapsed ? 'justify-center' : ''}
            `}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
              color: isActive ? '#C6A75E' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'rgba(198,167,94,0.1)' : 'transparent',
              borderLeft: isActive && !collapsed ? '3px solid #C6A75E' : '3px solid transparent',
            }}
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
