import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { parseYouTubeId } from '@/lib/content/shared';

/** Normalize input to 11-char YouTube ID only. Rejects raw URLs from other domains. */
function normalizeYouTubeId(input: string | null | undefined): string | null {
  if (input == null || typeof input !== 'string') return null;
  return parseYouTubeId(input.trim());
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { id, title, youtube_id: rawYoutubeId, youtube_url, thumbnail_url, is_featured, display_order, status: statusInput } = body;

    const youtubeIdInput = rawYoutubeId ?? youtube_url;
    const normalizedId = normalizeYouTubeId(youtubeIdInput);

    if (id) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (title != null) updates.title = title;
      if (thumbnail_url != null) updates.thumbnail_url = thumbnail_url;
      if (is_featured != null) updates.is_featured = is_featured;
      if (display_order != null) updates.display_order = display_order;
      const status = statusInput === 'draft' || statusInput === 'archived' ? statusInput : 'published';
      (updates as Record<string, unknown>).status = status;
      if (youtubeIdInput != null) {
        if (!normalizedId) {
          return NextResponse.json(
            { error: 'Invalid YouTube URL or ID. Use youtube.com/watch?v=..., youtu.be/..., or an 11-character video ID.' },
            { status: 400 }
          );
        }
        updates.youtube_id = normalizedId;
      }

      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Admin videos update error:', error);
        return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
      }
      revalidatePath('/media');
      return NextResponse.json({ video: data });
    }

    if (!normalizedId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL or ID. Use youtube.com/watch?v=..., youtu.be/..., or an 11-character video ID.' },
        { status: 400 }
      );
    }

    const { data: maxOrder } = await supabase
      .from('videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const order = display_order ?? (maxOrder?.display_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('videos')
      .insert({
        title: title ?? '',
        youtube_id: normalizedId,
        thumbnail_url: thumbnail_url ?? null,
        is_featured: is_featured ?? false,
        display_order: order,
        status: statusInput === 'draft' || statusInput === 'archived' ? statusInput : 'published',
      })
      .select()
      .single();
    if (error) {
      console.error('Admin videos insert error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ video: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin videos POST error:', err);
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
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      console.error('Admin videos DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidatePath('/media');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    console.error('Admin videos DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
