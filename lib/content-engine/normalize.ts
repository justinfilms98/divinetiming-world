/**
 * Phase 1 Content Engine — pure, side-effect-free helpers.
 *
 * These functions do NO I/O so they are safe to import from client or server
 * and are directly unit-testable (see __tests__/normalize.test.ts). They back
 * idempotency (source identity), URL safety, content classification, and the
 * "unambiguous publish target" rule used by the inbox.
 */

import { parseYouTubeId } from '@/lib/content/shared';
import type { ContentDraft, DraftType, SourceType } from './types';

/**
 * Validate and normalize an externally supplied URL.
 * Returns the normalized href for http/https URLs only, else null.
 * Rejects javascript:, data:, file:, etc. to prevent unsafe imports.
 */
export function sanitizeExternalUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return parsed.href;
}

/**
 * Stable identity for idempotency: `${provider}:${externalId}`.
 * Returns null when there is no external id (manual entries), which signals
 * "do not dedupe by identity" to callers.
 */
export function buildSourceIdentity(
  provider: string | null | undefined,
  externalId: string | null | undefined,
): string | null {
  const p = (provider ?? '').trim().toLowerCase();
  const e = (externalId ?? '').trim();
  if (!p || !e) return null;
  return `${p}:${e}`;
}

/** Extract a YouTube id from a URL/string, or null. */
export function extractYouTubeId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  return parseYouTubeId(input);
}

/** Guess the source_type of a pasted URL (best-effort; never throws). */
export function inferSourceType(url: string | null): SourceType {
  if (!url) return 'unknown';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'video';
  if (u.includes('instagram.com/reel')) return 'reel';
  if (u.includes('instagram.com/p/')) return 'post';
  if (u.includes('instagram.com')) return 'post';
  return 'link';
}

/** Suggest a draft_type from a source_type (conservative; defaults to unknown). */
export function inferDraftType(sourceType: SourceType): DraftType {
  switch (sourceType) {
    case 'video':
      return 'video';
    case 'reel':
    case 'image':
    case 'carousel':
    case 'post':
      return 'media';
    case 'event':
      return 'event';
    case 'release':
      return 'release';
    default:
      return 'unknown';
  }
}

export interface VideoPublishTarget {
  entityType: 'video';
  youtubeId: string;
  title: string;
}

/**
 * Phase 1 publishing is intentionally conservative: the ONLY unambiguous
 * mapping is a YouTube video draft -> existing `videos` model. Everything else
 * returns null and stays an approved draft for a later phase.
 *
 * A draft is publishable as a video only when its type is 'video' and a valid
 * YouTube id can be derived from extracted fields, media, or the source URL.
 */
export function resolveVideoPublishTarget(
  draft: Pick<ContentDraft, 'draft_type' | 'title' | 'extracted' | 'media'>,
  sourceUrl?: string | null,
): VideoPublishTarget | null {
  if (draft.draft_type !== 'video') return null;

  const extracted = draft.extracted ?? {};
  const candidates: unknown[] = [
    (extracted as Record<string, unknown>).youtube_id,
    (extracted as Record<string, unknown>).youtubeId,
    (extracted as Record<string, unknown>).url,
    ...(Array.isArray(draft.media) ? draft.media.map((m) => m?.url) : []),
    sourceUrl,
  ];

  for (const c of candidates) {
    const id = extractYouTubeId(typeof c === 'string' ? c : '');
    if (id) {
      return {
        entityType: 'video',
        youtubeId: id,
        title: (draft.title ?? '').trim() || 'Untitled',
      };
    }
  }
  return null;
}

/** Terminal draft statuses cannot transition further (except via re-open, not in Phase 1). */
export const TERMINAL_DRAFT_STATUSES = ['rejected', 'ignored', 'published'] as const;

export function isTerminalDraftStatus(status: string): boolean {
  return (TERMINAL_DRAFT_STATUSES as readonly string[]).includes(status);
}
