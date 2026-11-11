import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { apiError, apiSuccess } from '@/lib/apiResponses';
import { statusForCreate } from '@/lib/admin/publicationStatus';
import {
  checkJournalInput,
  isPublicJournalStatus,
  isSlugLocked,
  publicReadinessProblems,
  suggestJournalSlug,
} from '@/lib/journal/rules';
import {
  JOURNAL_STATUSES,
  type AdminJournalEpisode,
  type JournalEpisode,
  type JournalEpisodeVideo,
} from '@/lib/journal/types';

/** Journal pages read fresh from the database on the server, so saves refresh them here. */
function revalidateJournal(...slugs: (string | null | undefined)[]) {
  revalidatePath('/journal');
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/journal/${slug}`);
}

function joinList(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

type Db = NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>;

async function loadVideo(supabase: Db, episodeId: string): Promise<JournalEpisodeVideo | null> {
  const { data } = await supabase
    .from('journal_episode_videos')
    .select('episode_id, provider, video_id, is_vertical, duration_seconds')
    .eq('episode_id', episodeId)
    .maybeSingle();
  return (data as JournalEpisodeVideo | null) ?? null;
}

/** Every episode, any status, with its video (admin only). */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const [episodes, videos] = await Promise.all([
    supabase.from('journal_episodes').select('*').order('display_order', { ascending: true }),
    supabase.from('journal_episode_videos').select('episode_id, provider, video_id, is_vertical, duration_seconds'),
  ]);
  if (episodes.error || videos.error) return apiError('Operation failed.', 500);
  const byEpisode = new Map(((videos.data ?? []) as JournalEpisodeVideo[]).map((v) => [v.episode_id, v]));
  const list: AdminJournalEpisode[] = ((episodes.data ?? []) as JournalEpisode[]).map((e) => ({
    ...e,
    video: byEpisode.get(e.id) ?? null,
  }));
  return apiSuccess(list);
}

/** Create (no id) or update (id) an episode and its video link. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Nothing to save.', 400);
  }
  const id = typeof body.id === 'string' ? body.id : null;
  const checked = checkJournalInput(body, id ? 'update' : 'create');
  if (!checked.ok) return apiError(checked.error, 400);
  const changes = { ...checked.episode };

  let existing: JournalEpisode | null = null;
  if (id) {
    const { data } = await supabase.from('journal_episodes').select('*').eq('id', id).maybeSingle();
    existing = (data as JournalEpisode | null) ?? null;
    if (!existing) return apiError('This episode no longer exists. Refresh the page.', 404);
  }

  const status = existing ? (changes.status ?? existing.status) : statusForCreate(changes.status, JOURNAL_STATUSES);
  changes.status = status;

  // URL: suggested on create; locked once published so shared links keep working.
  if (!existing) {
    changes.slug = changes.slug || suggestJournalSlug(changes.episode_number ?? null, changes.title ?? '');
    if (!changes.slug) return apiError('Episode URL needs at least one letter or number.', 400);
  } else if (changes.slug && changes.slug !== existing.slug) {
    if (isSlugLocked(existing)) {
      return apiError('This episode has been published, so its URL can’t change (shared links would break).', 400);
    }
  } else {
    delete changes.slug;
  }
  if (changes.slug) {
    const { data: clash } = await supabase.from('journal_episodes').select('id').eq('slug', changes.slug).maybeSingle();
    if (clash && (clash as { id: string }).id !== id) return apiError('Another episode already uses this URL.', 409);
  }

  const merged = { ...(existing ?? {}), ...changes } as JournalEpisode;
  if (isPublicJournalStatus(status)) {
    const missing = publicReadinessProblems(merged);
    if (missing.length > 0) {
      const where = status === 'published' ? 'publish it' : 'show it as coming soon';
      return apiError(`Not saved: to ${where}, the episode still needs ${joinList(missing)}. Save it as a draft for now, or add them.`, 400);
    }
  }
  if (status === 'published' && !existing?.published_at) changes.published_at = new Date().toISOString();

  if (!existing && changes.display_order === undefined) {
    // Newest episodes go to the top of the owners' order.
    const { data: first } = await supabase
      .from('journal_episodes')
      .select('display_order')
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    changes.display_order = ((first as { display_order?: number } | null)?.display_order ?? 1) - 1;
  }

  const write = existing
    ? supabase.from('journal_episodes').update(changes).eq('id', existing.id).select().single()
    : supabase.from('journal_episodes').insert(changes).select().single();
  const { data: saved, error } = await write;
  if (error || !saved) {
    if (error?.code === '23505') {
      return /number/.test(error.message ?? '')
        ? apiError(`Another episode already uses number ${merged.episode_number}. Archive it or choose another number.`, 409)
        : apiError('Another episode already uses this URL.', 409);
    }
    return apiError('Operation failed.', 500);
  }
  const episode = saved as JournalEpisode;

  const change = checked.video;
  if (change) {
    const current = await loadVideo(supabase, episode.id);
    let videoError = null as { message: string } | null;
    if (change.remove) {
      if (current) ({ error: videoError } = await supabase.from('journal_episode_videos').delete().eq('episode_id', episode.id));
    } else if (change.provider && change.video_id) {
      const row = {
        provider: change.provider,
        video_id: change.video_id,
        is_vertical: change.is_vertical ?? current?.is_vertical ?? false,
      };
      ({ error: videoError } = current
        ? await supabase.from('journal_episode_videos').update(row).eq('episode_id', episode.id)
        : await supabase.from('journal_episode_videos').insert({ episode_id: episode.id, ...row }));
    } else if (change.is_vertical !== undefined && current) {
      ({ error: videoError } = await supabase
        .from('journal_episode_videos')
        .update({ is_vertical: change.is_vertical })
        .eq('episode_id', episode.id));
    }
    if (videoError) {
      revalidateJournal(episode.slug, existing?.slug);
      return apiError('The episode was saved, but the video link wasn’t. Try saving again.', 500);
    }
  }

  revalidateJournal(episode.slug, existing?.slug);
  const result: AdminJournalEpisode = { ...episode, video: await loadVideo(supabase, episode.id) };
  return apiSuccess({ episode: result });
}

/** Reorder by swapping two episodes' positions. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  let swap: unknown;
  try {
    ({ swap } = await request.json());
  } catch {
    return apiError('swap array with 2 items required', 400);
  }
  if (!Array.isArray(swap) || swap.length !== 2 || swap.some((s) => typeof s?.id !== 'string' || !Number.isInteger(s?.display_order))) {
    return apiError('swap array with 2 items required', 400);
  }
  const [a, b] = swap as { id: string; display_order: number }[];
  const first = await supabase.from('journal_episodes').update({ display_order: b.display_order }).eq('id', a.id).select('slug').single();
  const second = await supabase.from('journal_episodes').update({ display_order: a.display_order }).eq('id', b.id).select('slug').single();
  if (first.error || second.error) return apiError('Operation failed.', 500);
  revalidateJournal();
  return apiSuccess({});
}

/** Permanently removes a draft. Anything that has been public is archived instead. Media is never touched. */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiError('id required', 400);
  const { data } = await supabase.from('journal_episodes').select('id, slug, status, published_at').eq('id', id).maybeSingle();
  const existing = data as Pick<JournalEpisode, 'id' | 'slug' | 'status' | 'published_at'> | null;
  if (!existing) return apiError('This episode no longer exists. Refresh the page.', 404);
  if (existing.status !== 'draft' || existing.published_at) {
    return apiError('Only drafts that were never published can be deleted. Archive this episode instead.', 409);
  }
  const { error } = await supabase.from('journal_episodes').delete().eq('id', id);
  if (error) return apiError('Operation failed.', 500);
  revalidateJournal(existing.slug);
  return apiSuccess({});
}
