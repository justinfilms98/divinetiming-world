import { createClient } from '@/lib/supabase/server';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import {
  Calendar,
  Image as ImageIcon,
  ShoppingBag,
  Layers,
  BookOpen,
  FileText,
  Disc3,
  Mail,
  Scale,
  UserCircle,
  Settings2,
  Plus,
  Upload,
  Clapperboard,
  Compass,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface StatCard {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  color: string;
}

interface QuickAction {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    eventsCount,
    productsCount,
    videosCount,
    galleriesCount,
    libraryCount,
    releasesCount,
    inquiriesCount,
  ] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
    supabase.from('galleries').select('id', { count: 'exact', head: true }),
    supabase.from('external_media_assets').select('id', { count: 'exact', head: true }),
    supabase.from('releases').select('id', { count: 'exact', head: true }),
    supabase
      .from('booking_inquiries')
      .select('id', { count: 'exact', head: true })
      .in('status', ['new', 'contacted', 'negotiating']),
  ]);

  const stats: StatCard[] = [
    {
      label: 'Releases',
      value: releasesCount.count ?? 0,
      icon: Disc3,
      href: '/admin/releases',
      color: 'text-[#C6A75E]',
    },
    {
      label: 'Events',
      value: eventsCount.count ?? 0,
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-400',
    },
    {
      label: 'Open inquiries',
      value: inquiriesCount.count ?? 0,
      icon: Mail,
      href: '/admin/booking-inquiries',
      color: 'text-amber-400',
    },
    {
      label: 'Media library',
      value: libraryCount.count ?? 0,
      icon: ImageIcon,
      href: '/admin/media',
      color: 'text-purple-400',
    },
    {
      label: 'Products',
      value: productsCount.count ?? 0,
      icon: ShoppingBag,
      href: '/admin/shop',
      color: 'text-green-400',
    },
    {
      label: 'Collections',
      value: galleriesCount.count ?? 0,
      icon: ImageIcon,
      href: '/admin/collections',
      color: 'text-amber-400',
    },
    {
      label: 'Videos',
      value: videosCount.count ?? 0,
      icon: ImageIcon,
      href: '/admin/videos',
      color: 'text-rose-400',
    },
    {
      label: 'Hero',
      value: '—',
      icon: Layers,
      href: '/admin/hero',
      color: 'text-white/50',
    },
    {
      label: 'Journey',
      value: '—',
      icon: BookOpen,
      href: '/admin/journey',
      color: 'text-white/50',
    },
    {
      label: 'Press Kit',
      value: '—',
      icon: FileText,
      href: '/admin/presskit',
      color: 'text-white/50',
    },
  ];

  const quickActions: QuickAction[] = [
    { label: 'Edit Homepage', hint: 'Hero media & copy', href: '/admin/hero', icon: Clapperboard },
    { label: 'Add Release', hint: 'Music catalog', href: '/admin/releases', icon: Plus },
    { label: 'Add Event', hint: 'Tour dates', href: '/admin/events', icon: Calendar },
    { label: 'View Inquiries', hint: 'Booking requests', href: '/admin/booking-inquiries', icon: Mail },
    { label: 'Press Kit', hint: 'EPK content', href: '/admin/presskit', icon: FileText },
    { label: 'Upload Media', hint: 'Library', href: '/admin/media', icon: Upload },
    { label: 'Shop', hint: 'Products', href: '/admin/shop', icon: ShoppingBag },
    { label: 'Policies', hint: 'Legal pages', href: '/admin/policies', icon: Scale },
    { label: 'Journey', hint: 'Story chapters', href: '/admin/journey', icon: Compass },
    { label: 'About', hint: 'Bio & members', href: '/admin/about', icon: UserCircle },
    { label: 'Label', hint: 'Imprint page', href: '/admin/label', icon: Building2 },
    { label: 'Site Settings', hint: 'Contact & social', href: '/admin/settings', icon: Settings2 },
  ];

  return (
    <AdminPage title="Dashboard" subtitle="Overview and quick links">
      <section>
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-3">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <AdminCard className="hover:border-white/20 transition-colors cursor-pointer h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </AdminCard>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-white/40 mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href + action.label} href={action.href}>
                <AdminCard className="hover:border-[#C6A75E]/40 transition-colors cursor-pointer h-full">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#C6A75E]">
                      <Icon className="w-4 h-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{action.label}</p>
                      <p className="text-white/40 text-xs truncate">{action.hint}</p>
                    </div>
                  </div>
                </AdminCard>
              </Link>
            );
          })}
        </div>
      </section>
    </AdminPage>
  );
}
