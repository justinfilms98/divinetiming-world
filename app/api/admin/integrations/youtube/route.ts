import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isContentInboxEnabled } from '@/lib/features';
import { writeAudit } from '@/lib/content-engine/server';
import {
  isYouTubeConfigured,
  resolveChannel,
  YOUTUBE_CREDENTIAL_REF,
} from '@/lib/content-engine/adapters/youtube';
import { parseChannelInput } from '@/lib/content-engine/adapters/youtubeNormalize';

function featureGuard(): NextResponse | null {
  if (!isContentInboxEnabled()) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  return null;
}

/** GET — configuration status + connected YouTube accounts (no secrets returned). */
export async function GET() {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const { data } = await supabase
    .from('connected_accounts')
    .select('id, provider, external_account_id, display_name, status, sync_mode, last_sync_at, created_at')
    .eq('provider', 'youtube')
    .order('created_at', { ascending: false });

  return NextResponse.json({ configured: isYouTubeConfigured(), accounts: data ?? [] });
}

/** POST — connect a channel by id / @handle / URL. Stores the uploads playlist id. */
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

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = parseChannelInput(body?.channel);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Enter a YouTube channel ID (UC…), @handle, or channel URL.' },
        { status: 400 },
      );
    }

    const channel = await resolveChannel(parsed);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });
    }

    // Dedupe by (provider, external_account_id): update if present, else insert.
    const { data: existing } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('provider', 'youtube')
      .eq('external_account_id', channel.channelId)
      .maybeSingle();

    const payload = {
      provider: 'youtube',
      external_account_id: channel.channelId,
      display_name: channel.title,
      status: 'connected',
      credential_ref: YOUTUBE_CREDENTIAL_REF,
      config: { uploads_playlist_id: channel.uploadsPlaylistId },
      updated_at: new Date().toISOString(),
    };

    let accountId: string;
    if (existing?.id) {
      const { error } = await supabase.from('connected_accounts').update(payload).eq('id', existing.id);
      if (error) throw error;
      accountId = existing.id as string;
    } else {
      const { data: inserted, error } = await supabase
        .from('connected_accounts')
        .insert(payload)
        .select('id')
        .single();
      if (error || !inserted) throw error ?? new Error('insert failed');
      accountId = inserted.id as string;
    }

    await writeAudit(supabase, {
      actorEmail,
      action: 'youtube_connect',
      targetType: 'connected_account',
      targetId: accountId,
      metadata: { channel_id: channel.channelId },
    });

    return NextResponse.json({ ok: true, account: { id: accountId, channelId: channel.channelId, title: channel.title } });
  } catch (err) {
    console.error('YouTube connect error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}

/** DELETE — disconnect (stops future syncs; keeps published content and links). */
export async function DELETE(request: NextRequest) {
  const gate = featureGuard();
  if (gate) return gate;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;
  const actorEmail = auth.user?.email ?? null;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('connected_accounts')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('YouTube disconnect error:', error);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }

  await writeAudit(supabase, {
    actorEmail,
    action: 'youtube_disconnect',
    targetType: 'connected_account',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
