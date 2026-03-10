'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { Plus, ShoppingBag, Edit, Trash2, DollarSign, X, AlertTriangle } from 'lucide-react';
import { revalidateAfterSave, revalidatePaths } from '@/lib/revalidate';
import { useAdminToast } from '@/components/admin/AdminToast';

interface ProductImage {
  id: string;
  image_url: string | null;
  display_order: number;
  external_media_asset_id?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description: string | null;
  price_cents: number;
  is_featured: boolean;
  is_active: boolean;
  badge?: string | null;
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
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const { showToast } = useAdminToast();
  const supabase = createClient();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    fetch('/api/admin/shop-config', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setStripeConfigured(d.stripeConfigured === true))
      .catch(() => setStripeConfigured(false));
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order, external_media_asset_id)')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    const sorted = (data || []).map((p: any) => ({
      ...p,
      product_images: (p.product_images || []).sort(
        (a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
    })) as Product[];
    const assetIds = new Set<string>();
    for (const p of sorted) {
      for (const img of p.product_images || []) {
        if (img.external_media_asset_id && !img.image_url) assetIds.add(img.external_media_asset_id);
      }
    }
    let previewByAssetId: Record<string, string> = {};
    if (assetIds.size > 0) {
      const { data: assets } = await supabase
        .from('external_media_assets')
        .select('id, preview_url')
        .in('id', Array.from(assetIds));
      if (assets) {
        for (const a of assets as { id: string; preview_url: string }[]) {
          previewByAssetId[a.id] = a.preview_url || '';
        }
      }
    }
    const withResolved = sorted.map((p) => ({
      ...p,
      product_images: (p.product_images || []).map((img: ProductImage) => ({
        ...img,
        image_url: img.image_url || previewByAssetId[img.external_media_asset_id!] || null,
      })),
    }));
    setProducts(withResolved);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setPendingImages([]);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setPendingImages([]);
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
        subtitle: (formData.get('subtitle') as string)?.trim() || null,
        description: (formData.get('description') as string) || null,
        price: parseFloat((formData.get('price') as string) || '0'),
        is_featured: formData.get('is_featured') === 'on',
        badge: (formData.get('badge') as string) || null,
        status: (formData.get('status') as string) || 'published',
        images,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast('error', (data.error as string) || res.statusText);
      return;
    }

    const updated = data.product as Product | undefined;
    if (updated?.id) {
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === updated.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updated };
          return next;
        }
        return prev;
      });
    }
    setPendingImages([]);
    await loadProducts();
    const pathSlug = updated?.slug ?? editingProduct?.slug;
    const paths = pathSlug ? ['/shop', `/shop/${pathSlug}`] : ['/shop'];
    await revalidatePaths(paths);
    showToast('success', editingProduct ? 'Product updated' : 'Product created');
    closeModal();
  };

  const handleImageSelected = (files: UploadedFile[]) => {
    setPendingImages((prev) => [...prev, ...files.map((f) => ({ url: f.url, id: f.id }))]);
  };

  const handleLibraryImageSelect = (asset: { id: string; preview_url: string }) => {
    if (editingProduct) {
      handleAddImageToProduct(editingProduct.id, asset.preview_url, editingProduct.slug, asset.id);
    } else {
      setPendingImages((prev) => [...prev, { url: asset.preview_url, id: asset.id }]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      showToast('error', (data.error as string) || res.statusText);
      return;
    }
    await loadProducts();
    await revalidateAfterSave('shop');
    showToast('success', 'Product deleted');
  };

  const handleRemoveImage = async (productId: string, imageId: string, productSlug?: string) => {
    const res = await fetch(`/api/admin/product-images?id=${imageId}&slug=${productSlug || ''}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('error', (data.error as string) || res.statusText);
      return;
    }
    await loadProducts();
    await revalidatePaths(productSlug ? ['/shop', `/shop/${productSlug}`] : ['/shop']);
    const { data: d } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order, external_media_asset_id)')
      .eq('id', productId)
      .single();
    if (d) setEditingProduct({ ...d, product_images: (d.product_images || []).sort((a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)) } as Product);
    showToast('success', 'Image removed');
  };

  const handleAddImageToProduct = async (productId: string, url: string, productSlug?: string, externalAssetId?: string) => {
    const res = await fetch('/api/admin/product-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        product_id: productId,
        url: url.trim() || undefined,
        external_asset_id: externalAssetId ?? undefined,
        slug: productSlug,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('error', (data.error as string) || res.statusText);
      return;
    }
    await loadProducts();
    await revalidatePaths(productSlug ? ['/shop', `/shop/${productSlug}`] : ['/shop']);
    const { data: d } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order, external_media_asset_id)')
      .eq('id', productId)
      .single();
    if (d) setEditingProduct({ ...d, product_images: (d.product_images || []).sort((a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)) } as Product);
    showToast('success', 'Image added');
  };

  if (isLoading) {
    return (
      <AdminPage title="Shop" subtitle="Manage products and inventory">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Shop"
      subtitle="Manage your merchandise and products"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4" />
          New Product
        </button>
      }
    >
      {stripeConfigured === false && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-sm text-amber-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Stripe not connected.</strong> Add <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> and <code className="bg-amber-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code> to your environment to enable checkout. Products will still appear on the Shop page; checkout will fail until Stripe is configured.
          </div>
        </div>
      )}
      {products.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="Add your first product to start selling merchandise."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </button>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const images = product.product_images || [];
            const mainImage = images[0]?.image_url?.trim() || null;

            return (
              <AdminCard key={product.id} className="hover:border-white/20 transition-colors overflow-hidden p-0">
                <div className="aspect-square relative bg-white/5">
                  {mainImage ? (
                    <>
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          const fb = t.parentElement?.querySelector('.product-card-fallback');
                          if (fb) (fb as HTMLElement).classList.remove('hidden');
                        }}
                      />
                      <div className="product-card-fallback absolute inset-0 hidden flex items-center justify-center bg-white/5">
                        <ShoppingBag className="w-12 h-12 text-white/20" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/5">
                      <ShoppingBag className="w-12 h-12 text-white/20" />
                      <span className="text-xs text-white/50 font-medium">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                      {product.subtitle && (
                        <p className="text-sm text-white/60 truncate mt-0.5">{product.subtitle}</p>
                      )}
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
                    {((product as { status?: string }).status && (product as { status?: string }).status !== 'published') ? (
                      <span className={`px-2 py-1 text-xs rounded ${(product as { status?: string }).status === 'draft' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {(product as { status?: string }).status === 'draft' ? 'Draft' : 'Archived'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-green-400/20 text-green-400">
                        Published
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">
                        Featured
                      </span>
                    )}
                    {product.badge && (
                      <span className="px-2 py-1 text-xs rounded border border-white/20 text-white/80">
                        {product.badge}
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
                <label className="block text-white/70 text-sm font-medium mb-2">Visibility</label>
                <select
                  name="status"
                  defaultValue={(editingProduct as { status?: string })?.status ?? (editingProduct?.is_active ? 'published' : 'draft')}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="published">Published (visible on Shop)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
                <p className="text-white/50 text-xs mt-1">Only published products appear on the public Shop page.</p>
              </div>

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
                <label className="block text-white/70 text-sm font-medium mb-2">Product URL</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={editingProduct?.slug || ''}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="e.g. my-product (auto-generated if empty)"
                />
                <p className="text-white/50 text-xs mt-1">Used in product links (e.g. /shop/my-product). Use lowercase with hyphens.</p>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Subtitle (optional)</label>
                <input
                  type="text"
                  name="subtitle"
                  defaultValue={editingProduct?.subtitle ?? ''}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="Short line under name, e.g. Limited run"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Badge (optional)</label>
                <select
                  name="badge"
                  defaultValue={editingProduct?.badge ?? ''}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="">None</option>
                  <option value="Limited">Limited</option>
                  <option value="New">New</option>
                </select>
                <p className="text-white/50 text-xs mt-1">Sold out is shown automatically when out of stock.</p>
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
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 relative">
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const t = e.target as HTMLImageElement;
                              t.style.display = 'none';
                              const fallback = t.parentElement?.querySelector('.shop-thumb-fallback');
                              if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                            }}
                          />
                          <div className="shop-thumb-fallback absolute inset-0 hidden flex items-center justify-center bg-white/5 text-white/40 text-xs">Preview</div>
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
                  <div className="flex flex-wrap gap-2">
                    <UniversalUploader
                      multiple
                      acceptedTypes={['image']}
                      onSelected={handleImageSelected}
                      onUploadingChange={setUploadInProgress}
                      buttonLabel="Upload image"
                    />
                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:border-slate-400"
                    >
                      Add from library
                    </button>
                  </div>
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
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 relative">
                          <img
                            src={img.image_url ?? ''}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const t = e.target as HTMLImageElement;
                              t.style.display = 'none';
                              const fallback = t.parentElement?.querySelector('.shop-thumb-fallback');
                              if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                            }}
                          />
                          <div className="shop-thumb-fallback absolute inset-0 hidden flex items-center justify-center bg-white/5 text-white/40 text-xs">Preview</div>
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      className="px-4 py-2 border border-white/20 rounded-lg text-white/90 hover:bg-white/10 text-sm"
                    >
                      Add from library
                    </button>
                    <input
                      type="url"
                      placeholder="https://..."
                      className="flex-1 min-w-[200px] px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
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
                  <UniversalUploader
                    multiple={false}
                    acceptedTypes={['image']}
                    onSelected={(files) => {
                      const f = files[0];
                      if (f && editingProduct) handleAddImageToProduct(editingProduct.id, f.url, editingProduct.slug);
                    }}
                    onUploadingChange={setUploadInProgress}
                    buttonLabel="Upload image"
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
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
                  disabled={uploadInProgress}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploadInProgress ? 'Uploading…' : editingProduct ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaLibraryPicker
        open={libraryPickerOpen}
        onClose={() => setLibraryPickerOpen(false)}
        onSelect={handleLibraryImageSelect}
        filter="image"
        title="Add image from library"
      />
    </AdminPage>
  );
}
