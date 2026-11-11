/**
 * Validation and publication rules for Journal episodes, shared by the admin API and editor.
 * Limits mirror the CHECK constraints in migration 061, so the database never has to refuse a save
 * the editor allowed.
 */
import { normalizeHeroEmbed } from '@/lib/embed';
import { requestedStatus } from '@/lib/admin/publicationStatus';
import {
  JOURNAL_STATUSES,
  PUBLIC_JOURNAL_STATUSES,
  type JournalEpisode,
  type JournalStatus,
  type JournalVideoProvider,
} from './types';

export const JOURNAL_LIMITS = {
  slug: 80,
  title: 120,
  location: 80,
  summary: 300,
  description: 5000,
  cover_alt: 200,
  release_note: 60,
  seo_title: 70,
  seo_description: 160,
} as const;

const FIELD_NAMES: Record<keyof typeof JOURNAL_LIMITS, string> = {
  slug: 'Episode URL',
  title: 'Title',
  location: 'Location',
  summary: 'Summary',
  description: 'Description',
  cover_alt: 'Cover description',
  release_note: 'Release note',
  seo_title: 'Search title',
  seo_description: 'Search description',
};

const TEXT_FIELDS = ['location', 'summary', 'description', 'cover_alt', 'release_note', 'seo_title', 'seo_description'] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPublicJournalStatus(status: unknown): status is (typeof PUBLIC_JOURNAL_STATUSES)[number] {
  return typeof status === 'string' && (PUBLIC_JOURNAL_STATUSES as readonly string[]).includes(status);
}

/** Lowercase words joined by single hyphens, at most 80 characters. */
export function toJournalSlug(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, JOURNAL_LIMITS.slug)
    .replace(/-+$/g, '');
}

/** "episode-3-barcelona" from 3 and "Barcelona"; just the title when there's no number. */
export function suggestJournalSlug(episodeNumber: number | null | undefined, title: string): string {
  const base = toJournalSlug(title);
  return episodeNumber ? toJournalSlug(`episode ${episodeNumber} ${base}`) : base;
}

export interface JournalVideoChange {
  remove?: true;
  provider?: JournalVideoProvider;
  video_id?: string;
  is_vertical?: boolean;
}

export type JournalInputCheck =
  | { ok: true; episode: Partial<JournalEpisode>; video: JournalVideoChange | null }
  | { ok: false; error: string };

function has(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function cleanText(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Checks an admin create/update body. Only fields present in the body are returned, so an edit
 * never resets fields it didn't send. Status and publish rules are applied separately.
 */
export function checkJournalInput(raw: unknown, mode: 'create' | 'update'): JournalInputCheck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Nothing to save.' };
  const body = raw as Record<string, unknown>;
  const episode: Partial<JournalEpisode> = {};

  if (mode === 'create' || has(body, 'title')) {
    const title = cleanText(body.title);
    if (!title) return { ok: false, error: 'Title is required.' };
    if (title.length > JOURNAL_LIMITS.title) return { ok: false, error: `Title can be at most ${JOURNAL_LIMITS.title} characters.` };
    episode.title = title;
  }

  for (const key of TEXT_FIELDS) {
    if (!has(body, key)) continue;
    const value = cleanText(body[key]);
    if (value === undefined) return { ok: false, error: `${FIELD_NAMES[key]} must be text.` };
    if (value && value.length > JOURNAL_LIMITS[key]) {
      return { ok: false, error: `${FIELD_NAMES[key]} can be at most ${JOURNAL_LIMITS[key]} characters.` };
    }
    episode[key] = value;
  }

  if (has(body, 'slug')) {
    const slug = toJournalSlug(body.slug);
    if (!slug) return { ok: false, error: 'Episode URL needs at least one letter or number.' };
    episode.slug = slug;
  }

  if (has(body, 'episode_number')) {
    const n = body.episode_number;
    if (n === null || n === '') episode.episode_number = null;
    else {
      const num = typeof n === 'string' ? Number(n.trim()) : n;
      if (typeof num !== 'number' || !Number.isInteger(num) || num < 1 || num > 9999) {
        return { ok: false, error: 'Episode number must be a whole number from 1 to 9999.' };
      }
      episode.episode_number = num;
    }
  }

  if (has(body, 'cover_image_url')) {
    const url = cleanText(body.cover_image_url);
    if (url === undefined) return { ok: false, error: 'Cover image must be a link.' };
    if (url) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return { ok: false, error: 'Cover image link is not valid.' };
      }
      if (parsed.protocol !== 'https:') return { ok: false, error: 'Cover image must be an https link.' };
    }
    episode.cover_image_url = url;
  }

  for (const key of ['external_cover_asset_id', 'gallery_id'] as const) {
    if (!has(body, key)) continue;
    const id = cleanText(body[key]);
    if (id && !UUID.test(id)) return { ok: false, error: key === 'gallery_id' ? 'Unknown Collection.' : 'Unknown Media Library item.' };
    episode[key] = id ?? null;
  }

  if (has(body, 'scheduled_for')) {
    const value = cleanText(body.scheduled_for);
    if (value === undefined) return { ok: false, error: 'Planned date must be a date.' };
    if (value) {
      const t = Date.parse(value);
      if (Number.isNaN(t)) return { ok: false, error: 'Planned date is not a valid date.' };
      episode.scheduled_for = new Date(t).toISOString();
    } else episode.scheduled_for = null;
  }

  if (has(body, 'status') && body.status != null) {
    const status = requestedStatus(body.status, JOURNAL_STATUSES);
    if (!status) return { ok: false, error: 'Status must be draft, coming soon, published or archived.' };
    episode.status = status;
  }

  if (has(body, 'display_order')) {
    if (typeof body.display_order !== 'number' || !Number.isInteger(body.display_order)) {
      return { ok: false, error: 'Order must be a whole number.' };
    }
    episode.display_order = body.display_order;
  }

  let video: JournalVideoChange | null = null;
  if (has(body, 'video_url')) {
    const link = cleanText(body.video_url);
    if (link === undefined) return { ok: false, error: 'Video link must be text.' };
    if (!link) video = { remove: true };
    else {
      const embed = normalizeHeroEmbed(link);
      if (!embed) {
        return {
          ok: false,
          error:
            'That video link isn’t a YouTube or Vimeo video we can play. Paste the video’s share or watch link, e.g. https://youtu.be/… or https://vimeo.com/….',
        };
      }
      video = { provider: embed.provider, video_id: embed.id };
    }
  }
  if (has(body, 'video_is_vertical')) {
    video = { ...(video ?? {}), is_vertical: body.video_is_vertical === true };
  }

  return { ok: true, episode, video };
}

/** What a visitor would be missing. Empty means the episode may be shown publicly. */
export function publicReadinessProblems(episode: Pick<JournalEpisode, 'title' | 'cover_image_url' | 'summary'>): string[] {
  const missing: string[] = [];
  if (!episode.title?.trim()) missing.push('a title');
  if (!episode.cover_image_url?.trim()) missing.push('a cover image');
  if (!episode.summary?.trim()) missing.push('a summary');
  return missing;
}

export function readinessMessage(status: JournalStatus, missing: string[]): string {
  const where = status === 'published' ? 'published' : 'shown as coming soon';
  return `Saved as before, not ${where}: the episode still needs ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;
}

/** Once an episode has been published its URL may be shared, so it can't change. */
export function isSlugLocked(existing: Pick<JournalEpisode, 'published_at'> | null | undefined): boolean {
  return !!existing?.published_at;
}

export function watchUrlFor(provider: JournalVideoProvider, videoId: string): string {
  return provider === 'youtube' ? `https://www.youtube.com/watch?v=${videoId}` : `https://vimeo.com/${videoId}`;
}

/** Player URL, loaded only after the visitor presses play. */
export function playerUrlFor(provider: JournalVideoProvider, videoId: string): string {
  return provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1`;
}

/** A planned date is only shown while it's still ahead; nothing is ever invented. */
export function upcomingDateLabel(scheduledFor: string | null | undefined, now = new Date()): string | null {
  if (!scheduledFor) return null;
  const t = Date.parse(scheduledFor);
  if (Number.isNaN(t) || t <= now.getTime()) return null;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function episodeLabel(episode: Pick<JournalEpisode, 'episode_number' | 'location'>): string {
  const parts = [episode.episode_number ? `EP ${String(episode.episode_number).padStart(2, '0')}` : null, episode.location];
  return parts.filter(Boolean).join(' · ');
}