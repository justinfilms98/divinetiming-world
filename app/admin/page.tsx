import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import Link from 'next/link';
import { Plus, Calendar, Image as ImageIcon, ShoppingBag, Package } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [eventsCount, productsCount, ordersCount, videosCount] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      label: 'Events',
      value: eventsCount.count || 0,
      icon: Calendar,
      href: '/admin/events',
      color: 'text-blue-400',
    },
    {
      label: 'Media Items',
      value: (videosCount.count || 0),
      icon: ImageIcon,
      href: '/admin/media',
      color: 'text-purple-400',
    },
    {
      label: 'Products',
      value: productsCount.count || 0,
      icon: ShoppingBag,
      href: '/admin/shop',
      color: 'text-green-400',
    },
    {
      label: 'Orders',
      value: ordersCount.count || 0,
      icon: Package,
      href: '/admin/orders',
      color: 'text-orange-400',
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your content and activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <AdminCard className="hover:border-white/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </AdminCard>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <AdminCard>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/events?create=true"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Create Event</span>
          </Link>
          <Link
            href="/admin/media?create=true"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Upload Media</span>
          </Link>
          <Link
            href="/admin/shop?create=true"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Add Product</span>
          </Link>
        </div>
      </AdminCard>
    </>
  );
}
