import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { variantLabel } from '@/lib/shop/commerce';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanInt(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

function cleanIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function cleanStripePriceId(value: unknown): string | null {
  const id = cleanText(value);
  if (!id) return null;
  if (!id.startsWith('price_')) return null;
  return id;
}

type VariantInput = {
  id?: string;
  name?: string;
  size?: string;
  color?: string;
  sku?: string;
  price_cents?: number | null;
  price?: number | null;
  inventory_count?: number | null;
  track_inventory?: boolean;
  shipping_weight_grams?: number | null;
  stripe_price_id?: string | null;
};

function normalizeVariant(input: VariantInput) {
  const size = cleanText(input.size);
  const color = cleanText(input.color);
  const sku = cleanText(input.sku);
  const name = variantLabel({ name: cleanText(input.name) ?? '', size, color });
  const priceCents =
    input.price_cents != null
      ? cleanInt(input.price_cents)
      : typeof input.price === 'number'
        ? Math.round(input.price * 100)
        : null;
  return {
    id: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : null,
    name,
    size,
    color,
    sku,
    price_cents: priceCents,
    inventory_count: cleanInt(input.inventory_count),
    track_inventory: input.track_inventory === true,
    shipping_weight_grams: cleanInt(input.shipping_weight_grams),
    stripe_price_id: cleanStripePriceId(input.stripe_price_id),
  };
}

async function syncVariants(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>,
  productId: string,
  variants: unknown
) {
  if (!Array.isArray(variants)) return;
  const incoming = (variants as VariantInput[])
    .map(normalizeVariant)
    .filter((v) => v.name || v.size || v.color || v.sku || v.stripe_price_id);
  const keepIds = incoming.map((v) => v.id).filter((id): id is string => Boolean(id));

  const { data: existing } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);
  const existingIds = (existing ?? []).map((row: { id: string }) => row.id);
  const toDelete = existingIds.filter((id) => !keepIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('product_variants').delete().in('id', toDelete);
  }

  for (const variant of incoming) {
    const row = {
      product_id: productId,
      name: variant.name,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      price_cents: variant.price_cents,
      inventory_count: variant.track_inventory ? (variant.inventory_count ?? 0) : variant.inventory_count,
      track_inventory: variant.track_inventory,
      shipping_weight_grams: variant.shipping_weight_grams,
      stripe_price_id: variant.stripe_price_id,
      updated_at: new Date().toISOString(),
    };
    if (variant.id && existingIds.includes(variant.id)) {
      const { error } = await supabase.from('product_variants').update(row).eq('id', variant.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('product_variants').insert(row);
      if (error) throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const {
      id,
      name,
      slug,
      subtitle,
      description,
      price_cents,
      price,
      is_featured,
      badge,
      display_order,
      images,
      status: statusInput,
      sku,
      category,
      shipping_weight_grams,
      is_preorder,
      preorder_ships_at,
      sale_starts_at,
      sale_ends_at,
      track_inventory,
      inventory_count,
      stripe_price_id,
      variants,
    } = body;

    const priceCents = price_cents ?? (typeof price === 'number' ? Math.round(price * 100) : null);
    const productSlug = slug || slugify(name || '') || `product-${Date.now()}`;
    const status = statusInput === 'draft' || statusInput === 'archived' ? statusInput : 'published';
    const tracking = track_inventory === true;
    const parsedStripePrice = cleanStripePriceId(stripe_price_id);
    if (cleanText(stripe_price_id) && !parsedStripePrice) {
      return NextResponse.json({ error: 'Stripe Price ID must start with price_.' }, { status: 400 });
    }

    const productData: Record<string, unknown> = {
      name: name ?? undefined,
      slug: productSlug,
      subtitle: subtitle ?? null,
      description: description ?? null,
      price_cents: priceCents ?? 0,
      is_active: status === 'published',
      is_featured: is_featured ?? false,
      badge: badge ?? null,
      display_order: display_order ?? 0,
      updated_at: new Date().toISOString(),
      status,
      sku: cleanText(sku),
      category: cleanText(category),
      shipping_weight_grams: cleanInt(shipping_weight_grams),
      is_preorder: is_preorder === true,
      preorder_ships_at: cleanIso(preorder_ships_at),
      sale_starts_at: cleanIso(sale_starts_at),
      sale_ends_at: cleanIso(sale_ends_at),
      track_inventory: tracking,
      inventory_count: tracking ? (cleanInt(inventory_count) ?? 0) : cleanInt(inventory_count),
      stripe_price_id: parsedStripePrice,
    };

    if (id) {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Admin products update error:', error);
        const isDuplicate = error.code === '23505';
        return NextResponse.json(
          { error: isDuplicate ? 'SKU or URL already exists.' : 'Operation failed.' },
          { status: isDuplicate ? 409 : 500 }
        );
      }
      try {
        await syncVariants(supabase, id, variants);
      } catch (variantErr) {
        console.error('Admin product variants update error:', variantErr);
        return NextResponse.json({ error: 'Product saved but variants failed. Check SKUs and try again.' }, { status: 500 });
      }
      if (Array.isArray(images) && images.length > 0) {
        const existing = await supabase
          .from('product_images')
          .select('display_order')
          .eq('product_id', id)
          .order('display_order', { ascending: false })
          .limit(1)
          .single();
        let order = (existing?.data?.display_order ?? -1) + 1;
        for (const img of images) {
          const url = img.url ?? img.image_url;
          const extId = img.external_asset_id ?? img.external_media_asset_id ?? img.id;
          if (url || extId) {
            await supabase.from('product_images').insert({
              product_id: id,
              image_url: url ?? null,
              external_media_asset_id: extId ?? null,
              display_order: order++,
            });
          }
        }
      }
      revalidatePath('/shop');
      revalidatePath(`/shop/${productSlug}`);
      const { data: withVariants } = await supabase
        .from('products')
        .select('*, product_images(id, image_url, display_order, external_media_asset_id), product_variants(*)')
        .eq('id', id)
        .single();
      return NextResponse.json({ product: withVariants ?? data });
    }

    const { data: inserted, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    if (error) {
      console.error('Admin products insert error:', error);
      const isDuplicate = error.code === '23505' || (error.message || '').toLowerCase().includes('unique') || (error.message || '').toLowerCase().includes('duplicate');
      const message = isDuplicate ? 'A product with this URL or SKU already exists. Use a different URL/SKU or edit the existing product.' : (error.message || 'Operation failed.');
      return NextResponse.json({ error: message }, { status: isDuplicate ? 409 : 500 });
    }

    try {
      await syncVariants(supabase, inserted.id, variants);
    } catch (variantErr) {
      console.error('Admin product variants insert error:', variantErr);
      return NextResponse.json({ error: 'Product created but variants failed. Edit the product to add them.' }, { status: 500 });
    }

    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const url = img.url ?? img.image_url;
        const extId = img.external_asset_id ?? img.external_media_asset_id ?? img.id;
        if (url || extId) {
          await supabase.from('product_images').insert({
            product_id: inserted.id,
            image_url: url ?? null,
            external_media_asset_id: extId ?? null,
            display_order: i,
          });
        }
      }
    }

    revalidatePath('/shop');
    revalidatePath(`/shop/${productSlug}`);
    const { data: withVariants } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, display_order, external_media_asset_id), product_variants(*)')
      .eq('id', inserted.id)
      .single();
    return NextResponse.json({ product: withVariants ?? inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin products POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Admin products DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/shop');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin products DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
