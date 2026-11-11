/**
 * Public Journal reads. Every query also filters by status, so a signed-in admin browsing the
 * public site sees exactly what visitors see; RLS enforces the same rules for the public key.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  PUBLIC_JOURNAL_COLUMNS,
  PUBLIC_JOURNAL_STATUSES,
  type JournalEpisodeVideo,
  type PublicJournalEpisode,
} from './types';

type Client = Awaited<ReturnType<typeof createClient>>;

/** Coming-soon episodes first, then the owners' order, then newest number first. */
export function sortPublicEpisodes<T extends Pick<PublicJournalEpisode, 'status' | 'display_order' | 'episode_number'>>(
  episodes: readonly T[]
): T[] {
  return [...episodes].sort(
    (a, b) =>
      Number(b.status === 'coming_soon') - Number(a.status === 'coming_soon') ||
      a.display_order - b.display_order ||
      (b.episode_number ?? 0) - (a.episode_number ?? 0)
  );
}

export async function getPublicJournalEpisodes(client?: Client): Promise<PublicJournalEpisode[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from('journal_episodes')
    .select(PUBLIC_JOURNAL_COLUMNS)
    .in('status', PUBLIC_JOURNAL_STATUSES)
    .order('display_order', { ascending: true });
  if (error || !data) return [];
  return sortPublicEpisodes(data as unknown as PublicJournalEpisode[]);
}

export async function getPublicJournalEpisode(slug: string, client?: Client): Promise<PublicJournalEpisode | null> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from('journal_episodes')
    .select(PUBLIC_JOURNAL_COLUMNS)
    .eq('slug', slug)
    .in('status', PUBLIC_JOURNAL_STATUSES)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as PublicJournalEpisode;
}

/** The video, only for a published episode. Coming-soon episodes never load one. */
export async function getPublishedJournalVideo(
  episode: Pick<PublicJournalEpisode, 'id' | 'status'>,
  client?: Client
): Promise<JournalEpisodeVideo | null> {
  if (episode.status !== 'published') return null;
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from('journal_episode_videos')
    .select('episode_id, provider, video_id, is_vertical, duration_seconds')
    .eq('episode_id', episode.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as JournalEpisodeVideo;
}
