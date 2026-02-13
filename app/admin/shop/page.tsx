'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, ShoppingBag, Edit, Trash2, DollarSign, X, Upload } from 'lucide-react';
import { compressMedia } from '@/lib/utils/compressMedia';
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    const productData = {
      name: formData.get('name') as string,
      slug,
      description: (formData.get('description') as string) || null,
      price_cents: Math.round(parseFloat((formData.get('price') as string) || '0') * 100),
      is_featured: formData.get('is_featured') === 'on',
      is_active: formData.get('is_active') === 'on',
      updated_at: new Date().toISOString(),
    };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      const maxOrder = products.length > 0 ? Math.max(...products.map((p) => p.display_order ?? 0)) : -1;
      const { data: inserted } = await supabase
        .from('products')
        .insert({ ...productData, display_order: maxOrder + 1 })
        .select('id')
        .single();

      if (inserted) {
        const uploadedUrls = (formData.getAll('image_url') as string[]).map((u) => u?.trim()).filter(Boolean);
        const textareaUrls = ((formData.get('image_urls') as string) || '')
          .split(/\r?\n/)
          .map((u) => u.trim())
          .filter(Boolean);
        const imageUrls = [...uploadedUrls, ...textareaUrls];
        for (let i = 0; i < imageUrls.length; i++) {
          if (imageUrls[i]) {
            await supabase.from('product_images').insert({
              product_id: inserted.id,
              image_url: imageUrls[i],
              display_order: i,
            });
          }
        }
      }
    }

    await loadProducts();
    const paths = editingProduct?.slug ? ['/shop', `/shop/${editingProduct.slug}`] : ['/shop'];
    await revalidatePaths(paths);
    closeModal();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const compressed = await compressMedia(file);
      const ext = compressed.name.split('.').pop() || 'jpg';
      const path = `product-images/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('media').upload(path, compressed, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const container = document.getElementById('product-images-list');
      if (container) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'image_url';
        input.value = urlData.publicUrl;
        container.appendChild(input);
      }
      const preview = document.getElementById('product-images-preview');
      if (preview) {
        const div = document.createElement('div');
        div.className = 'relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0';
        div.innerHTML = `<img src="${urlData.publicUrl}" alt="" class="w-full h-full object-cover" />`;
        preview.appendChild(div);
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('products').delete().eq('id', id);
    await loadProducts();
    await revalidateAfterSave('shop');
  };

  const handleRemoveImage = async (productId: string, imageId: string, productSlug?: string) => {
    await supabase.from('product_images').delete().eq('id', imageId);
    await loadProducts();
    await revalidatePaths(productSlug ? ['/shop', `/shop/${productSlug}`] : ['/shop']);
    setEditingProduct((prev) =>
      prev && prev.id === productId
        ? { ...prev, product_images: (prev.product_images || []).filter((img) => img.id !== imageId) }
        : prev
    );
  };

  const handleAddImageToProduct = async (productId: string, url: string, productSlug?: string) => {
    const images = editingProduct?.product_images || [];
    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.display_order ?? 0)) : -1;
    await supabase.from('product_images').insert({
      product_id: productId,
      image_url: url.trim(),
      display_order: maxOrder + 1,
    });
    await loadProducts();
    await revalidatePaths(productSlug ? ['/shop', `/shop/${productSlug}`] : ['/shop']);
    const { data } = await supabase.from('products').select('*, product_images(id, image_url, display_order)').eq('id', productId).single();
    if (data) setEditingProduct({ ...data, product_images: (data.product_images || []).sort((a: ProductImage, b: ProductImage) => (a.display_order ?? 0) - (b.display_order ?? 0)) } as Product);
  };

  if (isLoading) {
    return (
      <div>
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
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        }
      />

      {products.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={ShoppingBag}
            title="No products yet"
            description="Add your first product to start selling merchandise."
            action={
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium mx-auto"
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
                  <div id="product-images-list" className="hidden" />
                  <div id="product-images-preview" className="flex flex-wrap gap-2 mb-2" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="product-image-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50' : 'hover:border-[var(--accent)]'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload image'}
                  </label>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !editingProduct) return;
                      setUploading(true);
                      try {
                        const compressed = await compressMedia(file);
                        const ext = compressed.name.split('.').pop() || 'jpg';
                        const path = `product-images/${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from('media').upload(path, compressed, { cacheControl: '3600', upsert: false });
                        if (error) throw error;
                        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
                        await handleAddImageToProduct(editingProduct.id, urlData.publicUrl, editingProduct.slug);
                      } catch (err: any) {
                        alert('Upload failed: ' + (err.message || 'Unknown error'));
                      } finally {
                        setUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                    className="hidden"
                    id="edit-product-image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="edit-product-image-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 mt-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer text-sm ${uploading ? 'opacity-50' : 'hover:border-white/20'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload image'}
                  </label>
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
    </>
  );
}
