import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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
      is_active,
      is_featured,
      badge,
      display_order,
      images,
      status: statusInput,
    } = body;

    const priceCents = price_cents ?? (typeof price === 'number' ? Math.round(price * 100) : null);
    const productSlug = slug || slugify(name || '') || `product-${Date.now()}`;
    const status = statusInput === 'draft' || statusInput === 'archived' ? statusInput : 'published';

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
        return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
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
      return NextResponse.json({ product: data });
    }

    const { data: inserted, error } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single();
    if (error) {
      console.error('Admin products insert error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
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
    return NextResponse.json({ product: inserted });
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
