import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isContentInboxEnabled } from '@/lib/features';
import { writeAudit } from '@/lib/content-engine/server';
import { ingestVideoItem } from '@/lib/content-engine/ingest';
import { isYouTubeConfigured, resolveChannel, fetchUploadsPage } from '@/lib/content-engine/adapters/youtube';
import { isNewerThanCheckpoint, maxPublishedAt } from '@/lib/content-engine/adapters/youtubeNormalize';
import type { NormalizedVideo } from '@/lib/content-engine/adapters/youtubeNormalize';

const DEFAULT_MAX_ITEMS = 25;
const HARD_CAP_ITEMS = 100;

function featureGuard(): NextResponse | null {
  if (!isContentInboxEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return null;
}

/** Best-effort classification of provider errors into a reconnect vs. transient state. */
function isAuthError(err: unknown): boolean {
  const code = (err as { code?: number | string })?.code;
  if (code === 401 || code === 403 || code === '401' || code === '403') return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('api key') || msg.includes('unauthor') || msg.includes('forbidden');
}

/**
 * POST — run an incremental YouTube sync for the connected channel.
 * Bounded (maxItems), idempotent (dedupe by video id), checkpoint-based, and
 * guarded against overlapping runs. Never auto-publishes: creates review drafts.
 */
export async function POST(request: NextRequest) {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const actorEmail = auth.user?.email ?? null;

  if (!isYouTubeConfigured()) {
    return NextResponse.json(
      { error: 'YouTube is not configured. Set the YOUTUBE_API_KEY environment variable on the server.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const maxItems = Math.min(Math.max(Number(body?.maxItems) || DEFAULT_MAX_ITEMS, 1), HARD_CAP_ITEMS);
  const accountId: string | null = typeof body?.accountId === 'string' ? body.accountId : null;

  // Load the target account.
  const accountSelect = supabase
    .from('connected_accounts')
    .select('id, external_account_id, display_name, status, checkpoint, config')
    .eq('provider', 'youtube');
  const { data: account } = await (accountId
    ? accountSelect.eq('id', accountId)
    : accountSelect.order('created_at', { ascending: false })
  )
    .limit(1)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: 'No YouTube channel connected. Connect one first.' }, { status: 400 });
  }
  if (account.status === 'disconnected') {
    return NextResponse.json({ error: 'This channel is disconnected. Reconnect it to sync.' }, { status: 400 });
  }

  // Overlap guard: refuse if a run is already in progress for this provider.
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: running } = await supabase
    .from('sync_runs')
    .select('id')
    .eq('provider', 'youtube')
    .eq('status', 'running')
    .gte('started_at', tenMinutesAgo)
    .limit(1)
    .maybeSingle();
  if (running?.id) {
    return NextResponse.json({ error: 'A sync is already in progress. Try again shortly.' }, { status: 409 });
  }

  // Open a run.
  const { data: run } = await supabase
    .from('sync_runs')
    .insert({ provider: 'youtube', status: 'running' })
    .select('id')
    .single();
  const runId = (run?.id as string) ?? null;

  const checkpoint: string | null = (account.checkpoint as string | null) ?? null;
  const counts = { imported: 0, duplicate: 0, failed: 0, processed: 0 };
  const collected: NormalizedVideo[] = [];

  try {
    // Resolve the uploads playlist (from config, else re-resolve from channel id).
    let uploadsPlaylistId: string | null =
      (account.config as { uploads_playlist_id?: string } | null)?.uploads_playlist_id ?? null;
    if (!uploadsPlaylistId && account.external_account_id) {
      const resolved = await resolveChannel({ channelId: account.external_account_id as string });
      uploadsPlaylistId = resolved?.uploadsPlaylistId ?? null;
    }
    if (!uploadsPlaylistId) {
      throw new Error('Could not resolve the channel uploads playlist.');
    }

    let pageToken: string | null = null;
    let stop = false;

    while (!stop && counts.processed < maxItems) {
      const page = await fetchUploadsPage(uploadsPlaylistId, {
        pageToken,
        maxResults: Math.min(50, maxItems - counts.processed),
      });

      for (const v of page.items) {
        // Incremental: uploads are newest-first, so stop at the first non-new item.
        if (!isNewerThanCheckpoint(v.publishedAt, checkpoint)) {
          stop = true;
          break;
        }
        const outcome = await ingestVideoItem(supabase, {
          provider: 'youtube',
          externalId: v.externalId,
          sourceUrl: v.sourceUrl,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: v.publishedAt,
        });
        counts.processed += 1;
        collected.push(v);

        let itemStatus: 'processed' | 'duplicate' | 'error' = 'processed';
        if (outcome.status === 'created') counts.imported += 1;
        else if (outcome.status === 'duplicate') {
          counts.duplicate += 1;
          itemStatus = 'duplicate';
        } else {
          counts.failed += 1;
          itemStatus = 'error';
        }

        if (runId) {
          await supabase.from('sync_items').insert({
            sync_run_id: runId,
            source_id: outcome.status !== 'error' ? outcome.sourceId : null,
            external_content_id: v.externalId,
            status: itemStatus,
            error: outcome.status === 'error' ? outcome.error : null,
          });
        }

        if (counts.processed >= maxItems) {
          stop = true;
          break;
        }
      }

      if (!page.nextPageToken) break;
      pageToken = page.nextPageToken;
    }

    const newCheckpoint = maxPublishedAt(collected, checkpoint);

    await supabase
      .from('connected_accounts')
      .update({
        checkpoint: newCheckpoint,
        last_sync_at: new Date().toISOString(),
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    if (runId) {
      await supabase
        .from('sync_runs')
        .update({
          status: counts.failed > 0 ? 'partial' : 'success',
          ended_at: new Date().toISOString(),
          counts,
          checkpoint: newCheckpoint,
        })
        .eq('id', runId);
    }

    await writeAudit(supabase, {
      actorEmail,
      action: 'youtube_sync',
      targetType: 'connected_account',
      targetId: account.id as string,
      metadata: counts,
    });

    return NextResponse.json({ ok: true, counts });
  } catch (err) {
    console.error('YouTube sync error:', err);
    const authProblem = isAuthError(err);

    await supabase
      .from('connected_accounts')
      .update({ status: authProblem ? 'needs_reconnect' : 'error', updated_at: new Date().toISOString() })
      .eq('id', account.id)
      .then(() => undefined, () => undefined);

    if (runId) {
      await supabase
        .from('sync_runs')
        .update({
          status: 'error',
          ended_at: new Date().toISOString(),
          counts,
          error_summary: authProblem ? 'auth/reconnect required' : 'sync failed',
        })
        .eq('id', runId)
        .then(() => undefined, () => undefined);
    }

    return NextResponse.json(
      {
        error: authProblem
          ? 'YouTube rejected the request. Check the API key / channel access and reconnect.'
          : 'Sync failed. Please try again later.',
      },
      { status: authProblem ? 400 : 500 },
    );
  }
}
