import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { apiSuccess, apiError } from '@/lib/apiResponses';
import type { Release, ReleaseStatus, ReleaseType } from '@/lib/types/content';

const RELEASE_TYPES: ReleaseType[] = ['single', 'ep', 'album', 'remix', 'compilation', 'mix'];
const STATUSES: ReleaseStatus[] = ['draft', 'scheduled', 'published', 'archived'];

function toKebabSlug(s: string | null | undefined): string {
  if (!s || typeof s !== 'string') return '';
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
}

function generateSlug(title: string): string {
  const base = toKebabSlug(title) || 'release';
  return `${base}-${Date.now().toString(36)}`;
}

function cleanUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
}

function revalidateRelease(slug?: string | null) {
  revalidatePath('/music');
  revalidatePath('/');
  if (slug) revalidatePath(`/music/${slug}`);
}

/** List every release regardless of status (admin view). */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .order('release_date', { ascending: false, nullsFirst: false })
    .order('display_order', { ascending: true });

  if (error) return apiError('Operation failed.', 500);
  return apiSuccess((data || []) as Release[]);
}

/** Create or update a release. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const body = await request.json();
    const { id, title, slug: slugInput } = body;

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) return apiError('Title is required', 400);

    const releaseType: ReleaseType = RELEASE_TYPES.includes(body.release_type)
      ? body.release_type
      : 'single';
    const status: ReleaseStatus = STATUSES.includes(body.status) ? body.status : 'draft';

    const releaseData: Record<string, unknown> = {
      title: cleanTitle,
      release_type: releaseType,
      release_date: cleanUrl(body.release_date),
      cover_image_url: cleanUrl(body.cover_image_url),
      external_cover_asset_id: cleanUrl(body.external_cover_asset_id),
      spotify_url: cleanUrl(body.spotify_url),
      apple_music_url: cleanUrl(body.apple_music_url),
      youtube_url: cleanUrl(body.youtube_url),
      soundcloud_url: cleanUrl(body.soundcloud_url),
      beatport_url: cleanUrl(body.beatport_url),
      description: cleanUrl(body.description),
      credits: cleanUrl(body.credits),
      video_url: cleanUrl(body.video_url),
      is_featured: !!body.is_featured,
      status,
      updated_at: new Date().toISOString(),
    };

    const requestedSlug = toKebabSlug(slugInput);

    if (id) {
      if (requestedSlug) {
        const { data: existing } = await supabase
          .from('releases')
          .select('id')
          .eq('slug', requestedSlug)
          .maybeSingle();
        if (existing && (existing as { id: string }).id !== id) {
          return apiError('Another release already uses this slug', 409);
        }
        releaseData.slug = requestedSlug;
      }

      const { data, error } = await supabase
        .from('releases')
        .update(releaseData)
        .eq('id', id)
        .select()
        .single();
      if (error) return apiError('Operation failed.', 500);

      revalidateRelease((data as { slug?: string })?.slug);
      return apiSuccess({ release: data });
    }

    const slug = requestedSlug || generateSlug(cleanTitle);
    const { data: collision } = await supabase
      .from('releases')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (collision) return apiError('A release with this slug already exists', 409);

    const displayOrder = Number.isFinite(body.display_order) ? body.display_order : 0;
    const { data, error } = await supabase
      .from('releases')
      .insert({ ...releaseData, slug, display_order: displayOrder })
      .select()
      .single();
    if (error) return apiError('Operation failed.', 500);

    revalidateRelease(slug);
    return apiSuccess({ release: data });
  } catch {
    return apiError('Operation failed.', 500);
  }
}

/** Reorder two releases by swapping display_order. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const { swap } = (await request.json()) as {
      swap?: [{ id: string; display_order: number }, { id: string; display_order: number }];
    };
    if (!Array.isArray(swap) || swap.length !== 2) {
      return apiError('swap array with 2 items required', 400);
    }
    const [a, b] = swap;
    const now = new Date().toISOString();
    await supabase.from('releases').update({ display_order: b.display_order, updated_at: now }).eq('id', a.id);
    await supabase.from('releases').update({ display_order: a.display_order, updated_at: now }).eq('id', b.id);

    revalidateRelease();
    return apiSuccess({});
  } catch {
    return apiError('Operation failed.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return apiError('id required', 400);

    const { data: existing } = await supabase
      .from('releases')
      .select('slug')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('releases').delete().eq('id', id);
    if (error) return apiError('Operation failed.', 500);

    revalidateRelease((existing as { slug?: string } | null)?.slug);
    return apiSuccess({});
  } catch {
    return apiError('Operation failed.', 500);
  }
}
