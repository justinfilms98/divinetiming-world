import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { product_id, url, external_asset_id, slug } = body;
    if (!product_id || (!url && !external_asset_id)) {
      return NextResponse.json({ error: 'product_id and (url or external_asset_id) required' }, { status: 400 });
    }

    const { data: maxOrder } = await supabase
      .from('product_images')
      .select('display_order')
      .eq('product_id', product_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const order = (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id,
        image_url: url ?? null,
        external_media_asset_id: external_asset_id ?? null,
        display_order: order,
      })
      .select()
      .single();
    if (error) {
      console.error('Admin product-images POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/shop');
    if (slug) revalidatePath(`/shop/${slug}`);
    return NextResponse.json({ image: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin product-images POST error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase.from('product_images').delete().eq('id', id);
    if (error) {
      console.error('Admin product-images DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath('/shop');
    if (slug) revalidatePath(`/shop/${slug}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin product-images DELETE error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
