import {
  LayoutDashboard,
  ImagePlay,
  Video,
  Clapperboard,
  FolderOpen,
  CalendarDays,
  Disc3,
  Compass,
  UserCircle,
  FileText,
  Mail,
  Users,
  ShoppingBag,
  Package,
  Scale,
  Settings2,
  Building2,
  Plug,
  Inbox,
  UserCog,
  House,
  Images,
  PenSquare,
  HeartHandshake,
  Ellipsis,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isContentInboxEnabled } from '@/lib/features';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** One line shown in the phone section sheet. */
  description: string;
  /** Planned page that doesn't exist yet: shown labelled, never linked. */
  comingSoon?: boolean;
}

export interface AdminNavGroup {
  id: 'home' | 'media' | 'content' | 'community' | 'more';
  label: string;
  icon: LucideIcon;
  items: AdminNavItem[];
}

/**
 * Single source of truth for admin navigation (desktop sidebar + phone tab bar).
 * Every existing admin route must appear here exactly once; URLs never change.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    icon: House,
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'Overview and quick actions' }],
  },
  {
    id: 'media',
    label: 'Media',
    icon: Images,
    items: [
      { label: 'Media Library', href: '/admin/media', icon: ImagePlay, description: 'Upload and organise photos and videos' },
      { label: 'YouTube Videos', href: '/admin/videos', icon: Video, description: 'Videos shown on the public Videos tab' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: PenSquare,
    items: [
      { label: 'Homepage & Hero', href: '/admin/hero', icon: Clapperboard, description: 'Homepage video and page headers' },
      { label: 'Collections', href: '/admin/collections', icon: FolderOpen, description: 'Photo stories' },
      { label: 'Events', href: '/admin/events', icon: CalendarDays, description: 'Shows and tour dates' },
      { label: 'Music', href: '/admin/releases', icon: Disc3, description: 'Releases and streaming links' },
      { label: 'Journey', href: '/admin/journey', icon: Compass, description: 'Story chapters' },
      { label: 'About', href: '/admin/about', icon: UserCircle, description: 'Bio shown on the About page' },
      { label: 'Press Kit', href: '/admin/presskit', icon: FileText, description: 'Bios, photos, riders and press' },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    icon: HeartHandshake,
    items: [
      { label: 'Booking Inquiries', href: '/admin/booking-inquiries', icon: Mail, description: 'Booking and contact form messages' },
      { label: 'Subscribers', href: '/admin/subscribers', icon: Users, description: 'Newsletter list', comingSoon: true },
    ],
  },
  {
    id: 'more',
    label: 'More',
    icon: Ellipsis,
    items: [
      { label: 'Shop', href: '/admin/shop', icon: ShoppingBag, description: 'Products and stock' },
      { label: 'Orders', href: '/admin/orders', icon: Package, description: 'Shop orders and fulfilment' },
      { label: 'Legal Policies', href: '/admin/policies', icon: Scale, description: 'Privacy, terms, refund, shipping' },
      { label: 'Settings', href: '/admin/settings', icon: Settings2, description: 'Artist name, links, booking contact' },
      { label: 'Label', href: '/admin/label', icon: Building2, description: 'Record label (not public yet)' },
      ...(isContentInboxEnabled()
        ? [
            { label: 'Integrations', href: '/admin/integrations', icon: Plug, description: 'Connected accounts' },
            { label: 'Content Inbox', href: '/admin/inbox', icon: Inbox, description: 'Imported drafts to review' },
          ]
        : []),
      { label: 'Team', href: '/admin/team', icon: UserCog, description: 'Who can edit and publish', comingSoon: true },
    ],
  },
];

export function isNavItemActive(item: AdminNavItem, pathname: string | null): boolean {
  if (!pathname || item.comingSoon) return false;
  if (item.href === '/admin') return pathname === '/admin';
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The group and item for the current route (used for the active tab and phone page title). */
export function findActiveNav(pathname: string | null): { group: AdminNavGroup; item: AdminNavItem } | null {
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (isNavItemActive(item, pathname)) return { group, item };
    }
  }
  return null;
}
