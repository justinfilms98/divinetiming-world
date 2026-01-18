'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, ShoppingBag, Edit, Trash2, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function AdminShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('products').delete().eq('id', id);
    await loadProducts();
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Shop" description="Manage products and inventory" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Shop"
        description="Manage your merchandise and products"
        actions={
          <Link
            href="/admin/shop/new"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        }
      />

      {products.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="Add your first product to start selling merchandise."
            action={
              <Link
                href="/admin/shop/new"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </Link>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <AdminCard key={product.id} className="hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
                  <div className="flex items-center gap-2 text-[var(--accent)]">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">{formatPrice(product.price_cents)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/shop/${product.id}`}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    product.is_active
                      ? 'bg-green-400/20 text-green-400'
                      : 'bg-red-400/20 text-red-400'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
                {product.is_featured && (
                  <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">
                    Featured
                  </span>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </>
  );
}
