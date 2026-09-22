import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isContentInboxEnabled } from '@/lib/features';
import { writeAudit } from '@/lib/content-engine/server';
import { sanitizeExternalUrl } from '@/lib/content-engine/normalize';
import { classifyManualUrl } from '@/lib/content-engine/classify';
import type { DraftType } from '@/lib/content-engine/types';

const VALID_DRAFT_TYPES: DraftType[] = [
  'media',
  'video',
  'event',
  'release',
  'homepage_feature',
  'shop_promotion',
  'general_update',
  'unknown',
];

/** 404 when the feature flag is off, so disabled routes are indistinguishable from absent. */
function featureGuard(): NextResponse | null {
  if (!isContentInboxEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return null;
}

/** GET /api/admin/inbox — list inbox items (drafts + their source), with filters. */
export async function GET(request: NextRequest) {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const provider = searchParams.get('provider');
  const draftType = searchParams.get('type');

  try {
    let query = supabase
      .from('content_drafts')
      .select('*, source:content_sources(*)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status) query = query.eq('status', status);
    if (draftType) query = query.eq('draft_type', draftType);

    const { data, error } = await query;
    if (error) {
      console.error('Inbox list error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }

    let items = data ?? [];
    // Provider filter is on the joined source; apply in-memory to keep the query simple.
    if (provider) {
      items = items.filter(
        (i) => (i as { source?: { provider?: string } }).source?.provider === provider,
      );
    }

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Inbox list exception:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/inbox — manual import (the Phase 1 ingestion path).
 * Body: { url?, title?, body?, draft_type? }. Requires url OR title.
 * Idempotent: re-importing the same URL that already has an active/published
 * draft returns the existing item instead of creating a duplicate.
 */
export async function POST(request: NextRequest) {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const actorEmail = auth.user?.email ?? null;

  let runId: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = body?.url;
    const url = rawUrl != null ? sanitizeExternalUrl(rawUrl) : null;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const text = typeof body?.body === 'string' ? body.body.trim() : '';

    if (rawUrl != null && rawUrl !== '' && !url) {
      return NextResponse.json(
        { error: 'Enter a valid http(s) URL, or leave the URL blank.' },
        { status: 400 },
      );
    }
    if (!url && !title) {
      return NextResponse.json(
        { error: 'Provide a URL or a title to create a draft.' },
        { status: 400 },
      );
    }

    // Classify the URL: provider, stable identity (for idempotency), and types.
    const classification = classifyManualUrl(url);
    const provider = classification.provider;
    const externalId = classification.externalId;
    const sourceType = classification.sourceType;
    const requestedType: DraftType | null =
      typeof body?.draft_type === 'string' && VALID_DRAFT_TYPES.includes(body.draft_type as DraftType)
        ? (body.draft_type as DraftType)
        : null;
    const draftType: DraftType = requestedType ?? classification.draftType;

    // Observability: record the manual run.
    const { data: run } = await supabase
      .from('sync_runs')
      .insert({ provider, status: 'running' })
      .select('id')
      .single();
    runId = (run?.id as string) ?? null;

    // Idempotency: prefer the provider-native identity (provider + externalId);
    // fall back to the source URL for generic links. If a matching source already
    // has an active/published draft, don't create a duplicate.
    let candidateSourceIds: string[] = [];
    if (externalId) {
      const { data: byIdentity } = await supabase
        .from('content_sources')
        .select('id')
        .eq('provider', provider)
        .eq('external_content_id', externalId)
        .limit(1);
      candidateSourceIds = (byIdentity ?? []).map((s) => s.id as string);
    } else if (url) {
      const { data: byUrl } = await supabase
        .from('content_sources')
        .select('id')
        .eq('source_url', url)
        .limit(50);
      candidateSourceIds = (byUrl ?? []).map((s) => s.id as string);
    }

    if (candidateSourceIds.length > 0) {
      const { data: existingDraft } = await supabase
        .from('content_drafts')
        .select('*, source:content_sources(*)')
        .in('source_id', candidateSourceIds)
        .in('status', ['new', 'needs_review', 'approved', 'published'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingDraft) {
        if (runId) {
          await supabase
            .from('sync_runs')
            .update({ status: 'success', ended_at: new Date().toISOString(), counts: { duplicate: 1 } })
            .eq('id', runId);
          await supabase.from('sync_items').insert({
            sync_run_id: runId,
            source_id: (existingDraft as { source_id?: string }).source_id ?? null,
            status: 'duplicate',
          });
        }
        return NextResponse.json({ item: existingDraft, duplicate: true });
      }
    }

    // Reuse an existing source (same identity, no active draft) or create one.
    let source: { id: string } | null = null;
    if (candidateSourceIds.length > 0) {
      source = { id: candidateSourceIds[0]! };
    }
    let sourceError: unknown = null;
    if (!source) {
      const inserted = await supabase
        .from('content_sources')
        .insert({
          provider,
          external_content_id: externalId,
          source_type: sourceType,
          source_url: url,
          title: title || null,
          raw: { title: title || null, body: text || null, url },
          captured_at: new Date().toISOString(),
          status: 'active',
        })
        .select('id')
        .single();
      source = inserted.data ? { id: inserted.data.id as string } : null;
      sourceError = inserted.error;
    }
    if (sourceError || !source) {
      console.error('Inbox source insert error:', sourceError);
      if (runId) {
        await supabase
          .from('sync_runs')
          .update({ status: 'error', ended_at: new Date().toISOString(), error_summary: 'source insert failed' })
          .eq('id', runId);
      }
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }

    // Create the draft (starts in needs_review so nothing is auto-published).
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .insert({
        source_id: source.id,
        draft_type: draftType,
        title: title || null,
        body: text || null,
        media: url && sourceType === 'video' ? [{ url, media_type: 'video' }] : [],
        extracted: url
          ? provider === 'youtube' && externalId
            ? { url, youtube_id: externalId }
            : { url }
          : {},
        status: 'needs_review',
      })
      .select('*, source:content_sources(*)')
      .single();
    if (draftError || !draft) {
      console.error('Inbox draft insert error:', draftError);
      if (runId) {
        await supabase
          .from('sync_runs')
          .update({ status: 'error', ended_at: new Date().toISOString(), error_summary: 'draft insert failed' })
          .eq('id', runId);
      }
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }

    if (runId) {
      await supabase
        .from('sync_runs')
        .update({ status: 'success', ended_at: new Date().toISOString(), counts: { imported: 1 } })
        .eq('id', runId);
      await supabase.from('sync_items').insert({
        sync_run_id: runId,
        source_id: source.id,
        status: 'processed',
      });
    }

    await writeAudit(supabase, {
      actorEmail,
      action: 'manual_import',
      targetType: 'content_draft',
      targetId: draft.id as string,
      metadata: { draft_type: draftType, has_url: !!url },
    });

    return NextResponse.json({ item: draft });
  } catch (err) {
    console.error('Inbox POST exception:', err);
    if (runId) {
      await supabase
        .from('sync_runs')
        .update({ status: 'error', ended_at: new Date().toISOString(), error_summary: 'exception' })
        .eq('id', runId)
        .then(() => undefined, () => undefined);
    }
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}
