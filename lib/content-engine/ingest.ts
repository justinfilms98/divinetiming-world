/**
 * Phase 2 Content Engine — server-only ingestion helper.
 *
 * Centralizes idempotent creation of a source + draft for provider items that
 * have a stable external id (e.g. a YouTube video). Re-ingesting the same item
 * never creates duplicate sources or a second active draft.
 */

import 'server-only';
import type { getServiceClient } from '@/lib/supabase/service';

type ServiceClient = ReturnType<typeof getServiceClient>;

export interface VideoIngestInput {
  provider: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
}

export type IngestOutcome =
  | { status: 'created'; sourceId: string; draftId: string }
  | { status: 'duplicate'; sourceId: string }
  | { status: 'error'; error: string };

/**
 * Idempotently ingest a video item as a source + review-pending draft.
 * - Source identity: (provider, externalId) — reused if it already exists.
 * - Draft: skipped if an active/published draft already exists for the source.
 */
export async function ingestVideoItem(
  supabase: ServiceClient,
  input: VideoIngestInput,
): Promise<IngestOutcome> {
  // 1. Find or create the source (dedupe by provider + external id).
  const { data: existingSource, error: findErr } = await supabase
    .from('content_sources')
    .select('id')
    .eq('provider', input.provider)
    .eq('external_content_id', input.externalId)
    .maybeSingle();
  if (findErr) return { status: 'error', error: 'source lookup failed' };

  let sourceId: string;
  if (existingSource?.id) {
    sourceId = existingSource.id as string;
  } else {
    const { data: created, error: insertErr } = await supabase
      .from('content_sources')
      .insert({
        provider: input.provider,
        external_content_id: input.externalId,
        source_type: 'video',
        source_url: input.sourceUrl,
        title: input.title,
        raw: {
          title: input.title,
          description: input.description ?? '',
          thumbnail_url: input.thumbnailUrl ?? null,
          published_at: input.publishedAt ?? null,
          url: input.sourceUrl,
        },
        captured_at: new Date().toISOString(),
        status: 'active',
      })
      .select('id')
      .single();
    if (insertErr || !created) return { status: 'error', error: 'source insert failed' };
    sourceId = created.id as string;
  }

  // 2. Skip if an active/published draft already exists for this source.
  const { data: existingDraft } = await supabase
    .from('content_drafts')
    .select('id')
    .eq('source_id', sourceId)
    .in('status', ['new', 'needs_review', 'approved', 'published'])
    .limit(1)
    .maybeSingle();
  if (existingDraft?.id) {
    return { status: 'duplicate', sourceId };
  }

  // 3. Create the review-pending draft.
  const { data: draft, error: draftErr } = await supabase
    .from('content_drafts')
    .insert({
      source_id: sourceId,
      draft_type: 'video',
      title: input.title,
      body: input.description ?? null,
      media: [{ url: input.sourceUrl, media_type: 'video', thumbnail_url: input.thumbnailUrl ?? null }],
      extracted: { youtube_id: input.externalId, url: input.sourceUrl },
      status: 'needs_review',
    })
    .select('id')
    .single();
  if (draftErr || !draft) return { status: 'error', error: 'draft insert failed' };

  return { status: 'created', sourceId, draftId: draft.id as string };
}
