/**
 * Phase 1 Content Engine — shared types.
 * Mirrors the tables created in migration 038_content_engine.sql.
 */

export type SourceProvider = 'manual' | 'instagram' | 'youtube' | string;

export type SourceType =
  | 'post'
  | 'video'
  | 'reel'
  | 'carousel'
  | 'image'
  | 'release'
  | 'event'
  | 'link'
  | 'unknown';

export type SourceStatus = 'active' | 'changed' | 'deleted';

export type DraftType =
  | 'media'
  | 'video'
  | 'event'
  | 'release'
  | 'homepage_feature'
  | 'shop_promotion'
  | 'general_update'
  | 'unknown';

/** Inbox lifecycle. Only 'published' has been pushed into an existing site model. */
export type DraftStatus =
  | 'new'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'ignored'
  | 'published'
  | 'error';

export interface ContentSource {
  id: string;
  provider: SourceProvider;
  external_content_id: string | null;
  source_type: SourceType;
  source_url: string | null;
  title: string | null;
  raw: Record<string, unknown>;
  captured_at: string | null;
  status: SourceStatus;
  created_at: string;
  updated_at: string;
}

export interface DraftMediaItem {
  url: string;
  media_type: 'image' | 'video' | 'embed';
  thumbnail_url?: string | null;
}

export interface ContentDraft {
  id: string;
  source_id: string | null;
  draft_type: DraftType;
  title: string | null;
  body: string | null;
  media: DraftMediaItem[];
  extracted: Record<string, unknown>;
  confidence: number | null;
  status: DraftStatus;
  published_entity_type: string | null;
  published_entity_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A draft joined with its source, as returned by the inbox list API. */
export interface InboxItem extends ContentDraft {
  source: ContentSource | null;
}

export const DRAFT_STATUSES: DraftStatus[] = [
  'new',
  'needs_review',
  'approved',
  'published',
  'rejected',
  'ignored',
  'error',
];

export const DRAFT_TYPES: DraftType[] = [
  'media',
  'video',
  'event',
  'release',
  'homepage_feature',
  'shop_promotion',
  'general_update',
  'unknown',
];
