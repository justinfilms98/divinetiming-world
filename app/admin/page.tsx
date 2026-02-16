import { createClient } from '@/lib/supabase/server';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { DashboardHeroEditor } from '@/components/admin/DashboardHeroEditor';
import { Calendar, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [eventsCount, productsCount, videosCount] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      label: 'Events',
      value: eventsCount.count || 0,
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-600',
    },
    {
      label: 'Media',
      value: videosCount.count || 0,
      icon: ImageIcon,
      href: '/admin/media',
      color: 'text-purple-600',
    },
    {
      label: 'Products',
      value: productsCount.count || 0,
      icon: ShoppingBag,
      href: '/admin/shop',
      color: 'text-green-600',
    },
  ];

  return (
    <AdminPage
      title="Dashboard"
      subtitle="Overview and hero editor for public pages"
    >
      {/* Hero Editor — top of dashboard */}
      <DashboardHeroEditor />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <AdminCard className="hover:border-slate-300 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-800">
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
    </AdminPage>
  );
}
