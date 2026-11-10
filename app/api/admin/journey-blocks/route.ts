import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';

/** Journey blocks CRUD (admin only). Mirrors gallery-media patterns. */

const BLOCK_SELECT = '*, external_image_asset:external_media_assets(id, preview_url)';

async function readJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { data, error } = await supabase
    .from('journey_blocks')
    .select(BLOCK_SELECT)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Admin journey-blocks GET error:', error);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
  return NextResponse.json({ blocks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await readJson(request);
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    const { id, title, body: bodyText, image_url, external_image_asset_id, align, display_order, era_label } =
      body as Record<string, string | number | null | undefined>;
    const status = body.status === 'published' ? 'published' : 'draft';
    const era = typeof era_label === 'string' && era_label.trim() ? era_label.trim() : null;

    if (id) {
      const { data, error } = await supabase
        .from('journey_blocks')
        .update({
          title: title ?? null,
          era_label: era,
          body: bodyText ?? null,
          image_url: image_url ?? null,
          external_image_asset_id: external_image_asset_id ?? null,
          align: align ?? 'left',
          display_order: display_order ?? 0,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(BLOCK_SELECT)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'This chapter no longer exists. Refresh the page.' }, { status: 404 });
        }
        console.error('Admin journey-blocks PUT error:', error);
        return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
      }
      revalidatePath('/journey');
      return NextResponse.json({ block: data });
    }

    const { data: maxOrder, error: orderError } = await supabase
      .from('journey_blocks')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) {
      console.error('Admin journey-blocks order read error:', orderError);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('journey_blocks')
      .insert({
        title: title ?? null,
        era_label: era,
        body: bodyText ?? null,
        image_url: image_url ?? null,
        external_image_asset_id: external_image_asset_id ?? null,
        align: align ?? 'left',
        display_order: order,
        status,
      })
      .select(BLOCK_SELECT)
      .single();
    if (error) {
      console.error('Admin journey-blocks POST error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/journey');
    return NextResponse.json({ block: data });
  } catch (err) {
    console.error('Admin journey-blocks POST error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

/** Reorder. Succeeds only if every listed chapter was updated. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await readJson(request);
    const items = body?.items;
    const valid =
      Array.isArray(items) &&
      items.length > 0 &&
      items.every(
        (i) => i && typeof i === 'object' && typeof i.id === 'string' && i.id && Number.isInteger(i.display_order)
      );
    if (!valid) {
      return NextResponse.json({ error: 'items must be a list of { id, display_order }' }, { status: 400 });
    }

    const failed: string[] = [];
    const missing: string[] = [];
    const now = new Date().toISOString();
    for (const item of items as { id: string; display_order: number }[]) {
      const { data, error } = await supabase
        .from('journey_blocks')
        .update({ display_order: item.display_order, updated_at: now })
        .eq('id', item.id)
        .select('id');
      if (error) {
        console.error('Admin journey-blocks PATCH error:', item.id, error);
        failed.push(item.id);
      } else if (!Array.isArray(data) || data.length === 0) {
        missing.push(item.id);
      }
    }

    const changed = items.length - failed.length - missing.length;
    if (changed > 0) revalidatePath('/journey');
    if (failed.length || missing.length) {
      return NextResponse.json(
        {
          error: `The new order was not fully saved (${changed} of ${items.length} chapters updated). Refresh the page and try again.`,
          failed,
          missing,
        },
        { status: failed.length ? 500 : 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin journey-blocks PATCH error:', err);
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
    const { error } = await supabase.from('journey_blocks').delete().eq('id', id);
    if (error) {
      console.error('Admin journey-blocks DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/journey');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin journey-blocks DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
