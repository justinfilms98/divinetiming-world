'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageShell } from '@/components/layout/PageShell';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { LuxurySkeletonGrid } from '@/components/ui/LuxurySkeleton';
import { Uploader } from '@/components/admin/Uploader';
import { Plus, ShoppingBag, Edit, Trash2, DollarSign, X } from 'lucide-react';
import { revalidateAfterSave, revalidatePaths } from '@/lib/revalidate';
import Image from 'next/image';

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  product_images?: ProductImage[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingImages, setPendingImages] = useState<{ url: string; id?: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order)')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    const sorted = (data || []).map((p: any) => ({
      ...p,
      product_images: (p.product_images || []).sort(
        (a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    }));
    setProducts(sorted);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    let slug = formData.get('slug') as string;
    if (!slug) slug = slugify(formData.get('name') as string) || `product-${Date.now()}`;

    const textareaUrls = ((formData.get('image_urls') as string) || '')
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url) => ({ url }));

    const images = [...pendingImages.map((p) => ({ url: p.url, external_media_asset_id: p.id })), ...textareaUrls].filter((i) => i.url);

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: editingProduct?.id,
        name: formData.get('name'),
        slug,
        description: (formData.get('description') as string) || null,
        price: parseFloat((formData.get('price') as string) || '0'),
        is_featured: formData.get('is_featured') === 'on',
        is_active: formData.get('is_active') === 'on',
        images,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }

    setPendingImages([]);
    await loadProducts();
    const paths = editingProduct?.slug ? ['/shop', `/shop/${editingProduct.slug}`] : ['/shop'];
    await revalidatePaths(paths);
    closeModal();
  };

  const handleImageSelected = (assets: { id: string; preview_url: string }[]) => {
    setPendingImages((prev) => [...prev, ...assets.map((a) => ({ url: a.preview_url, id: a.id }))]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadProducts();
    await revalidateAfterSave('shop');
  };

  const handleRemoveImage = async (productId: string, imageId: string, productSlug?: string) => {
    const res = await fetch(`/api/admin/product-images?id=${imageId}&slug=${productSlug || ''}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadProducts();
    await revalidatePaths(productSlug ? ['/shop', `/shop/${productSlug}`] : ['/shop']);
    const { data: d } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order)')
      .eq('id', productId)
      .single();
    if (d) setEditingProduct({ ...d, product_images: (d.product_images || []).sort((a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)) } as Product);
  };

  const handleAddImageToProduct = async (productId: string, url: string, productSlug?: string) => {
    const res = await fetch('/api/admin/product-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        product_id: productId,
        url: url.trim(),
        slug: productSlug,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || res.statusText));
      return;
    }
    await loadProducts();
    await revalidatePaths(productSlug ? ['/shop', `/shop/${productSlug}`] : ['/shop']);
    const { data: d } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order)')
      .eq('id', productId)
      .single();
    if (d) setEditingProduct({ ...d, product_images: (d.product_images || []).sort((a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)) } as Product);
  };

  if (isLoading) {
    return (
      <PageShell title="Shop" subtitle="Manage products and inventory">
        <LuxurySkeletonGrid count={6} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Shop"
      subtitle="Manage your merchandise and products"
      actions={
        <LuxuryButton onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </LuxuryButton>
      }
    >
      {products.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="Add your first product to start selling merchandise."
            action={
              <LuxuryButton onClick={openCreate} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Add Your First Product
              </LuxuryButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const images = product.product_images || [];
            const mainImage = images[0]?.image_url;

            return (
              <AdminCard key={product.id} className="hover:border-white/20 transition-colors overflow-hidden p-0">
                <div className="aspect-square relative bg-white/5">
                  {mainImage ? (
                    <Image
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 text-[var(--accent)] mt-1">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{formatPrice(product.price_cents)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        product.is_active ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
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
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0f0c10] border border-white/10 rounded-xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0f0c10] z-10">
              <h2 className="text-xl font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'Create Product'}
              </h2>
              <button onClick={closeModal} className="p-2 text-white/70 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct?.name || ''}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Slug</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={editingProduct?.slug || ''}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="url-friendly-name (auto-generated if empty)"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  defaultValue={editingProduct ? (editingProduct.price_cents / 100).toFixed(2) : ''}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingProduct?.description || ''}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                  placeholder="Optional product description"
                />
              </div>

              {/* Images: create flow */}
              {!editingProduct && (
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Product Images</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5">
                          <Image src={img.url} alt="" width={80} height={80} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Uploader
                    multiple
                    acceptedTypes={['image']}
                    onSelected={handleImageSelected}
                    buttonLabel="Upload image"
                  />
                  <p className="text-white/50 text-xs mt-1">Or add image URLs (one per line) below</p>
                  <textarea
                    name="image_urls"
                    rows={2}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white mt-2 resize-none"
                    placeholder="https://... (one URL per line)"
                  />
                </div>
              )}

              {/* Images: edit flow */}
              {editingProduct && (
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">Product Images</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editingProduct.product_images || []).map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5">
                          <Image src={img.image_url} alt="" width={80} height={80} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(editingProduct.id, img.id, editingProduct.slug)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      id="edit-image-url"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('edit-image-url') as HTMLInputElement;
                        const url = input?.value?.trim();
                        if (url) {
                          handleAddImageToProduct(editingProduct.id, url, editingProduct.slug);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 text-sm"
                    >
                      Add URL
                    </button>
                  </div>
                  <Uploader
                    multiple={false}
                    acceptedTypes={['image']}
                    onSelected={(assets) => {
                      const a = assets[0];
                      if (a && editingProduct) handleAddImageToProduct(editingProduct.id, a.preview_url, editingProduct.slug);
                    }}
                    buttonLabel="Upload image"
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingProduct?.is_active ?? true}
                    className="w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Active (visible in shop)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    defaultChecked={editingProduct?.is_featured ?? false}
                    className="w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Featured</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
