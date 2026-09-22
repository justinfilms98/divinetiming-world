import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { apiSuccess, apiError } from '@/lib/apiResponses';
import {
  hasUsableAltText,
  isMediaOrientation,
  isMediaUsageType,
  parseMediaTags,
  type MediaLibraryAsset,
  type MediaOrientation,
  type MediaUsageType,
} from '@/lib/media/types';

const LIBRARY_SELECT =
  'id, provider, preview_url, thumbnail_url, mime_type, name, size_bytes, created_at, updated_at, width, height, alt_text, photographer, location, captured_at, orientation, is_featured, usage_type, is_archived, category, tags';

function revalidateMedia() {
  revalidatePath('/admin/media');
  revalidatePath('/media');
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

/** GET — full library for admin UI and pickers. Archived hidden unless include_archived=1. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const includeArchived = request.nextUrl.searchParams.get('include_archived') === '1';

  let query = supabase
    .from('external_media_assets')
    .select(LIBRARY_SELECT)
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Admin media-library GET error:', error);
    return apiError('Operation failed.', 500);
  }
  return apiSuccess((data || []) as MediaLibraryAsset[]);
}

/** PATCH — update library metadata. Featured requires alt text. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!id) return apiError('id required', 400);

    const { data: existing, error: loadError } = await supabase
      .from('external_media_assets')
      .select('id, alt_text, is_featured')
      .eq('id', id)
      .maybeSingle();
    if (loadError || !existing) return apiError('Asset not found', 404);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ('name' in body) updates.name = cleanText(body.name);
    if ('alt_text' in body) updates.alt_text = cleanText(body.alt_text);
    if ('photographer' in body) updates.photographer = cleanText(body.photographer);
    if ('location' in body) updates.location = cleanText(body.location);
    if ('captured_at' in body) updates.captured_at = cleanDate(body.captured_at);
    if ('category' in body) updates.category = cleanText(body.category);
    if ('tags' in body) updates.tags = parseMediaTags(body.tags);
    if ('is_archived' in body) updates.is_archived = !!body.is_archived;

    if ('orientation' in body) {
      const next = body.orientation === '' || body.orientation == null ? null : body.orientation;
      if (next != null && !isMediaOrientation(next)) {
        return apiError('Invalid orientation', 400);
      }
      updates.orientation = next as MediaOrientation | null;
    }

    if ('usage_type' in body) {
      if (!isMediaUsageType(body.usage_type)) {
        return apiError('Invalid usage type', 400);
      }
      updates.usage_type = body.usage_type as MediaUsageType;
    }

    if ('is_featured' in body) {
      updates.is_featured = !!body.is_featured;
    }

    const nextAlt =
      'alt_text' in updates ? (updates.alt_text as string | null) : (existing.alt_text as string | null);
    const nextFeatured =
      'is_featured' in updates ? (updates.is_featured as boolean) : !!existing.is_featured;

    if (nextFeatured && !hasUsableAltText(nextAlt)) {
      return apiError('Alt text is required before marking an asset as featured.', 400);
    }

    const { data, error } = await supabase
      .from('external_media_assets')
      .update(updates)
      .eq('id', id)
      .select(LIBRARY_SELECT)
      .single();

    if (error) {
      console.error('Admin media-library PATCH error:', error);
      return apiError('Operation failed.', 500);
    }

    revalidateMedia();
    return apiSuccess({ asset: data as MediaLibraryAsset });
  } catch (err) {
    console.error('Admin media-library PATCH error:', err);
    return apiError('Operation failed.', 500);
  }
}

/** DELETE - remove asset from library. POST is handled by /api/assets/external */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await supabase.from('external_media_assets').delete().eq('id', id);
    if (error) {
      console.error('Admin media-library DELETE error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    revalidateMedia();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin media-library DELETE error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
