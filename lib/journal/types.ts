/** Journal (D2-C): vlog episodes and travel stories. Tables from migration 061. */

export const JOURNAL_STATUSES = ['draft', 'coming_soon', 'published', 'archived'] as const;
export type JournalStatus = (typeof JOURNAL_STATUSES)[number];

/** Statuses a visitor may see. Everything else is admin-only. */
export const PUBLIC_JOURNAL_STATUSES = ['published', 'coming_soon'] as const satisfies readonly JournalStatus[];

export const JOURNAL_STATUS_LABELS: Record<JournalStatus, string> = {
  draft: 'Draft',
  coming_soon: 'Coming soon',
  published: 'Published',
  archived: 'Archived',
};

export type JournalVideoProvider = 'youtube' | 'vimeo';

export interface JournalEpisode {
  id: string;
  slug: string;
  episode_number: number | null;
  title: string;
  location: string | null;
  summary: string | null;
  description: string | null;
  cover_image_url: string | null;
  external_cover_asset_id: string | null;
  cover_alt: string | null;
  gallery_id: string | null;
  status: JournalStatus;
  release_note: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

/** Private until the episode is published (separate table, RLS). */
export interface JournalEpisodeVideo {
  episode_id: string;
  provider: JournalVideoProvider;
  video_id: string;
  is_vertical: boolean;
  duration_seconds: number | null;
}

/** Admin list/editor row: the episode plus its video, if any. */
export interface AdminJournalEpisode extends JournalEpisode {
  video: JournalEpisodeVideo | null;
}

/** What public pages read. No video, no asset ids. */
export type PublicJournalEpisode = Pick<
  JournalEpisode,
  | 'id'
  | 'slug'
  | 'episode_number'
  | 'title'
  | 'location'
  | 'summary'
  | 'description'
  | 'cover_image_url'
  | 'cover_alt'
  | 'gallery_id'
  | 'status'
  | 'release_note'
  | 'scheduled_for'
  | 'published_at'
  | 'display_order'
  | 'seo_title'
  | 'seo_description'
  | 'updated_at'
>;

export const PUBLIC_JOURNAL_COLUMNS =
  'id, slug, episode_number, title, location, summary, description, cover_image_url, cover_alt, gallery_id, status, release_note, scheduled_for, published_at, display_order, seo_title, seo_description, updated_at';
