'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setIsLoading(false);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-400/20 text-green-400 border-green-400/30';
      case 'pending':
        return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 'failed':
        return 'bg-red-400/20 text-red-400 border-red-400/30';
      default:
        return 'bg-white/10 text-white/70 border-white/10';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Orders" description="View and manage customer orders" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="View and manage customer orders from Stripe"
      />

      {orders.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Orders will appear here once customers make purchases through your shop."
          />
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <AdminCard key={order.id}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {order.customer_name || order.customer_email}
                    </h3>
                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--accent)]">
                    {formatPrice(order.total_cents)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/70 mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="text-white/80 text-sm">
                      {item.quantity}x {item.product_name}
                      {item.variant_name && (
                        <span className="text-white/50"> ({item.variant_name})</span>
                      )}
                      <span className="text-white/50 ml-2">
                        - {formatPrice(item.price_cents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </>
  );
}
