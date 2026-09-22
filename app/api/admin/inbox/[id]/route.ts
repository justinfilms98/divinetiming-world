import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { isContentInboxEnabled } from '@/lib/features';
import { writeAudit } from '@/lib/content-engine/server';
import { resolveVideoPublishTarget } from '@/lib/content-engine/normalize';
import type { ContentDraft, DraftType } from '@/lib/content-engine/types';

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

// Admin-driven status transitions (excludes 'publish', which has its own logic).
const ACTION_TO_STATUS: Record<string, ContentDraft['status']> = {
  approve: 'approved',
  reject: 'rejected',
  ignore: 'ignored',
  needs_review: 'needs_review',
  reopen: 'needs_review',
};

function featureGuard(): NextResponse | null {
  if (!isContentInboxEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return null;
}

/**
 * PATCH /api/admin/inbox/[id]
 * Body may include field edits { title, body, draft_type, notes } and/or an
 * { action } of approve | reject | ignore | needs_review | reopen | publish.
 * Publish only maps a YouTube video draft into the existing `videos` model;
 * anything else stays an approved draft (fail-safe, admin-driven).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const actorEmail = auth.user?.email ?? null;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : null;

    const { data: draft, error: loadError } = await supabase
      .from('content_drafts')
      .select('*, source:content_sources(*)')
      .eq('id', id)
      .maybeSingle();
    if (loadError) {
      console.error('Inbox load error:', loadError);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'publish') {
      return await publishDraft(supabase, draft, actorEmail);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body?.title === 'string') updates.title = body.title.trim() || null;
    if (typeof body?.body === 'string') updates.body = body.body.trim() || null;
    if (typeof body?.notes === 'string') updates.notes = body.notes.trim() || null;
    if (typeof body?.draft_type === 'string' && VALID_DRAFT_TYPES.includes(body.draft_type)) {
      updates.draft_type = body.draft_type;
    }
    if (action) {
      const nextStatus = ACTION_TO_STATUS[action];
      if (!nextStatus) {
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
      }
      updates.status = nextStatus;
    }

    const { data: updated, error: updateError } = await supabase
      .from('content_drafts')
      .update(updates)
      .eq('id', id)
      .select('*, source:content_sources(*)')
      .single();
    if (updateError) {
      console.error('Inbox update error:', updateError);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }

    await writeAudit(supabase, {
      actorEmail,
      action: action ? `draft_${action}` : 'draft_edit',
      targetType: 'content_draft',
      targetId: id,
      metadata: { fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error('Inbox PATCH exception:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

/** DELETE /api/admin/inbox/[id] — remove a draft (source record is retained). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const actorEmail = auth.user?.email ?? null;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const { error } = await supabase.from('content_drafts').delete().eq('id', id);
    if (error) {
      console.error('Inbox delete error:', error);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    await writeAudit(supabase, {
      actorEmail,
      action: 'draft_delete',
      targetType: 'content_draft',
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Inbox DELETE exception:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

type ServiceClient = NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>;
type DraftWithSource = ContentDraft & { source?: { id?: string; source_url?: string | null } | null };

/**
 * Publish a draft into an existing content model. Phase 1 supports ONLY the
 * unambiguous case: a YouTube video draft -> `videos`. Idempotent: an already
 * published draft is a no-op, and an existing video with the same YouTube id
 * is linked rather than duplicated.
 */
async function publishDraft(
  supabase: ServiceClient,
  draft: DraftWithSource,
  actorEmail: string | null,
): Promise<NextResponse> {
  // No-op if already published.
  if (draft.status === 'published' && draft.published_entity_id) {
    return NextResponse.json({ item: draft, alreadyPublished: true });
  }

  const target = resolveVideoPublishTarget(
    { draft_type: draft.draft_type, title: draft.title, extracted: draft.extracted, media: draft.media },
    draft.source?.source_url ?? null,
  );

  if (!target) {
    return NextResponse.json(
      {
        error:
          'No unambiguous publish target for this draft in Phase 1. Only YouTube video drafts can be published automatically; leave it as an approved draft for a later phase.',
      },
      { status: 422 },
    );
  }

  // Dedupe against existing videos by YouTube id.
  const { data: existingVideo } = await supabase
    .from('videos')
    .select('id')
    .eq('youtube_id', target.youtubeId)
    .maybeSingle();

  let videoId: string;
  if (existingVideo?.id) {
    videoId = existingVideo.id as string;
  } else {
    const { data: maxOrder } = await supabase
      .from('videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const order = ((maxOrder?.display_order as number | undefined) ?? -1) + 1;

    const { data: inserted, error: insertError } = await supabase
      .from('videos')
      .insert({
        title: target.title,
        youtube_id: target.youtubeId,
        status: 'published',
        display_order: order,
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      console.error('Inbox publish video insert error:', insertError);
      return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
    }
    videoId = inserted.id as string;
  }

  // Link source -> published record (idempotent via unique index; ignore conflict).
  if (draft.source?.id) {
    await supabase
      .from('content_source_links')
      .upsert(
        { source_id: draft.source.id, entity_type: 'video', entity_id: videoId },
        { onConflict: 'source_id,entity_type,entity_id', ignoreDuplicates: true },
      )
      .then(() => undefined, () => undefined);
  }

  const { data: updated, error: updateError } = await supabase
    .from('content_drafts')
    .update({
      status: 'published',
      published_entity_type: 'video',
      published_entity_id: videoId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', draft.id)
    .select('*, source:content_sources(*)')
    .single();
  if (updateError) {
    console.error('Inbox publish draft update error:', updateError);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }

  revalidatePath('/media');

  await writeAudit(supabase, {
    actorEmail,
    action: 'draft_publish',
    targetType: 'content_draft',
    targetId: draft.id,
    metadata: { entity_type: 'video', entity_id: videoId, reused_existing: !!existingVideo?.id },
  });

  return NextResponse.json({ item: updated });
}
