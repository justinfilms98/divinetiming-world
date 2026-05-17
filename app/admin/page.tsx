import { createClient } from '@/lib/supabase/server';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Calendar, Image as ImageIcon, ShoppingBag, Layers, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [eventsCount, productsCount, videosCount, galleriesCount, libraryCount] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
    supabase.from('galleries').select('id', { count: 'exact', head: true }),
    supabase.from('external_media_assets').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      label: 'Hero',
      value: '—',
      icon: Layers,
      href: '/admin/hero',
      color: 'text-slate-600',
    },
    {
      label: 'Events',
      value: eventsCount.count || 0,
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-600',
    },
    {
      label: 'Media library',
      value: libraryCount.count || 0,
      icon: ImageIcon,
      href: '/admin/media',
      color: 'text-purple-600',
    },
    {
      label: 'Collections',
      value: galleriesCount.count || 0,
      icon: ImageIcon,
      href: '/admin/collections',
      color: 'text-amber-600',
    },
    {
      label: 'Videos',
      value: videosCount.count || 0,
      icon: ImageIcon,
      href: '/admin/videos',
      color: 'text-rose-600',
    },
    {
      label: 'Products',
      value: productsCount.count || 0,
      icon: ShoppingBag,
      href: '/admin/shop',
      color: 'text-green-600',
    },
    {
      label: 'Booking',
      value: '—',
      icon: BookOpen,
      href: '/admin/booking',
      color: 'text-slate-600',
    },
    {
      label: 'Press Kit',
      value: '—',
      icon: FileText,
      href: '/admin/presskit',
      color: 'text-slate-600',
    },
  ];

  return (
    <AdminPage
      title="Dashboard"
      subtitle="Overview and quick links"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <AdminCard className="hover:border-slate-300 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </AdminCard>
            </Link>
          );
        })}
      </div>
    </AdminPage>
  );
}
