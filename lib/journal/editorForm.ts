/**
 * Journal editor form values and the save payload. An edit sends only the fields that changed, so a
 * save never resets anything the owner didn't touch (same rule as the hero editor).
 */
import { watchUrlFor } from './rules';
import type { AdminJournalEpisode, JournalStatus } from './types';

export interface JournalForm {
  title: string;
  episode_number: string;
  slug: string;
  location: string;
  summary: string;
  description: string;
  cover_image_url: string;
  external_cover_asset_id: string;
  cover_alt: string;
  gallery_id: string;
  status: JournalStatus;
  release_note: string;
  /** yyyy-mm-dd, or empty. */
  scheduled_for: string;
  video_url: string;
  video_is_vertical: boolean;
  seo_title: string;
  seo_description: string;
}

export const EMPTY_JOURNAL_FORM: JournalForm = {
  title: '',
  episode_number: '',
  slug: '',
  location: '',
  summary: '',
  description: '',
  cover_image_url: '',
  external_cover_asset_id: '',
  cover_alt: '',
  gallery_id: '',
  status: 'draft',
  release_note: '',
  scheduled_for: '',
  video_url: '',
  video_is_vertical: false,
  seo_title: '',
  seo_description: '',
};

export function episodeToForm(episode: AdminJournalEpisode): JournalForm {
  return {
    title: episode.title ?? '',
    episode_number: episode.episode_number ? String(episode.episode_number) : '',
    slug: episode.slug ?? '',
    location: episode.location ?? '',
    summary: episode.summary ?? '',
    description: episode.description ?? '',
    cover_image_url: episode.cover_image_url ?? '',
    external_cover_asset_id: episode.external_cover_asset_id ?? '',
    cover_alt: episode.cover_alt ?? '',
    gallery_id: episode.gallery_id ?? '',
    status: episode.status,
    release_note: episode.release_note ?? '',
    scheduled_for: episode.scheduled_for ? episode.scheduled_for.slice(0, 10) : '',
    video_url: episode.video ? watchUrlFor(episode.video.provider, episode.video.video_id) : '',
    video_is_vertical: episode.video?.is_vertical ?? false,
    seo_title: episode.seo_title ?? '',
    seo_description: episode.seo_description ?? '',
  };
}

const FIELD_ORDER = Object.keys(EMPTY_JOURNAL_FORM) as (keyof JournalForm)[];

function toPayloadValue(key: keyof JournalForm, value: JournalForm[keyof JournalForm]): unknown {
  if (typeof value === 'boolean') return value;
  if (key === 'status') return value;
  const trimmed = value.trim();
  if (key === 'episode_number') return trimmed ? Number(trimmed) : null;
  if (key === 'scheduled_for') return trimmed ? `${trimmed}T12:00:00Z` : null;
  return trimmed;
}

/** Fields whose value differs from the saved form. */
export function changedFields(initial: JournalForm, current: JournalForm): (keyof JournalForm)[] {
  return FIELD_ORDER.filter((key) => {
    const a = initial[key];
    const b = current[key];
    return typeof a === 'string' && typeof b === 'string' ? a.trim() !== b.trim() : a !== b;
  });
}

/** Create: every filled field. Edit: only what changed. */
export function journalPayload(current: JournalForm, initial: JournalForm | null, id?: string): Record<string, unknown> {
  const keys = initial ? changedFields(initial, current) : FIELD_ORDER.filter((k) => k === 'status' || k === 'title' || current[k] !== EMPTY_JOURNAL_FORM[k]);
  const payload: Record<string, unknown> = id ? { id } : {};
  for (const key of keys) payload[key] = toPayloadValue(key, current[key]);
  return payload;
}
