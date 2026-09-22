'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Package } from 'lucide-react';

type OrderStatus = 'pending' | 'paid' | 'failed' | 'fulfilled' | 'cancelled' | 'refunded';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price_cents: number;
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string | null;
  total_cents: number;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  tracking_number: string | null;
  admin_notes: string | null;
  created_at: string;
  fulfilled_at: string | null;
  order_items: OrderItem[];
}

const STATUSES: OrderStatus[] = ['pending', 'paid', 'failed', 'fulfilled', 'cancelled', 'refunded'];

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/**
 * Admin order list. Rows appear after Stripe webhooks create them.
 * Live checkout is deferred — this UI is ready for test-mode orders.
 */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load orders');
      setOrders(json.data.orders as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (
    id: string,
    changes: { status?: OrderStatus; tracking_number?: string; admin_notes?: string }
  ) => {
    setSavingId(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)));
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      if (!res.ok) await load();
    } catch {
      await load();
    } finally {
      setSavingId(null);
    }
  };

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  if (loading) {
    return (
      <AdminPage title="Orders" subtitle="Shop orders from Stripe checkout">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage title="Orders" subtitle="Shop orders from Stripe checkout">
        <AdminCard className="border-amber-200 bg-amber-50 text-amber-800">
          <p>{error}</p>
        </AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Orders"
      subtitle="Fulfillment for paid shop orders. Checkout stays disabled until Stripe test-mode is verified."
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm border capitalize ${
              filter === s
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-16 h-16 text-slate-300 mb-4" aria-hidden />
            <p className="text-slate-600 font-medium">No orders yet</p>
            <p className="text-slate-500 text-sm mt-1 max-w-md">
              Orders appear here after a successful Stripe Checkout webhook. Live charging is still
              deferred — use test-mode keys when you are ready to verify end-to-end.
            </p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <AdminCard key={order.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full border text-xs font-medium capitalize bg-slate-50 text-slate-700 border-slate-200">
                      {order.status}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {order.customer_name || order.customer_email}
                    </span>
                    <a
                      href={`mailto:${order.customer_email}`}
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {order.customer_email}
                    </a>
                    <span className="text-sm font-medium text-slate-700">{money(order.total_cents)}</span>
                  </div>

                  <ul className="text-sm text-slate-600 space-y-1">
                    {(order.order_items || []).map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.product_name}
                        {item.variant_name ? ` (${item.variant_name})` : ''} — {money(item.price_cents)}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200">
                    <label className="text-sm text-slate-600">
                      Status
                      <select
                        value={order.status}
                        onChange={(e) => patch(order.id, { status: e.target.value as OrderStatus })}
                        className="ml-2 px-2 py-1 rounded border border-slate-300 text-sm bg-white capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-slate-600 flex-1 min-w-[200px]">
                      Tracking
                      <input
                        type="text"
                        defaultValue={order.tracking_number ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (order.tracking_number ?? '')) {
                            patch(order.id, { tracking_number: e.target.value });
                          }
                        }}
                        placeholder="Carrier tracking #"
                        className="ml-2 px-2 py-1 rounded border border-slate-300 text-sm w-full sm:w-auto sm:min-w-[200px]"
                      />
                    </label>
                    <label className="text-sm text-slate-600 flex-1 min-w-[220px]">
                      Notes
                      <input
                        type="text"
                        defaultValue={order.admin_notes ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (order.admin_notes ?? '')) {
                            patch(order.id, { admin_notes: e.target.value });
                          }
                        }}
                        placeholder="Internal note"
                        className="ml-2 px-2 py-1 rounded border border-slate-300 text-sm w-full sm:w-auto sm:min-w-[220px]"
                      />
                    </label>
                    {savingId === order.id && <span className="text-xs text-slate-400">Saving…</span>}
                  </div>
                </div>
                <p className="text-slate-400 text-xs shrink-0">{formatDate(order.created_at)}</p>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
