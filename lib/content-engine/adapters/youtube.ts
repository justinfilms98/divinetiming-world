/**
 * YouTube adapter — server-only network layer (YouTube Data API v3).
 *
 * Uses a server-side API key (YOUTUBE_API_KEY) to read PUBLIC channel uploads
 * and metadata — no OAuth, no user tokens, compliant with API terms for public
 * data. The key never reaches the browser. If the key is absent, callers get a
 * clear "not configured" signal and the feature no-ops gracefully.
 */

import 'server-only';
import { google } from 'googleapis';
import { mapPlaylistItem } from './youtubeNormalize';
import type { NormalizedVideo, RawPlaylistItem } from './youtubeNormalize';

/** The env var name that holds the credential (stored as connected_accounts.credential_ref). */
export const YOUTUBE_CREDENTIAL_REF = 'YOUTUBE_API_KEY';

export function isYouTubeConfigured(): boolean {
  const key = process.env.YOUTUBE_API_KEY;
  return typeof key === 'string' && key.length > 0;
}

function getClient() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY not configured');
  return google.youtube({ version: 'v3', auth: key });
}

export interface ResolvedChannel {
  channelId: string;
  title: string;
  uploadsPlaylistId: string;
}

interface RawChannelListItem {
  id?: string | null;
  snippet?: { title?: string | null } | null;
  contentDetails?: { relatedPlaylists?: { uploads?: string | null } | null } | null;
}

/**
 * Resolve a channel by id or @handle into { channelId, title, uploadsPlaylistId }.
 * Returns null if the channel cannot be found.
 */
export async function resolveChannel(input: { channelId?: string; handle?: string }): Promise<ResolvedChannel | null> {
  const youtube = getClient();
  const params: { part: string[]; id?: string[]; forHandle?: string } = {
    part: ['snippet', 'contentDetails'],
  };
  if (input.channelId) params.id = [input.channelId];
  else if (input.handle) params.forHandle = input.handle;
  else return null;

  const res = await youtube.channels.list(params);
  const items = (res.data.items ?? []) as RawChannelListItem[];
  const ch = items[0];
  const uploads = ch?.contentDetails?.relatedPlaylists?.uploads;
  if (!ch?.id || !uploads) return null;
  return {
    channelId: ch.id,
    title: ch.snippet?.title ?? '',
    uploadsPlaylistId: uploads,
  };
}

export interface UploadsPage {
  items: NormalizedVideo[];
  nextPageToken: string | null;
}

/**
 * Fetch one page of a channel's uploads playlist, newest first.
 * Bounded by `maxResults` (<= 50, the API limit). Pagination via `pageToken`.
 */
export async function fetchUploadsPage(
  uploadsPlaylistId: string,
  opts?: { pageToken?: string | null; maxResults?: number },
): Promise<UploadsPage> {
  const youtube = getClient();
  const res = await youtube.playlistItems.list({
    part: ['snippet', 'contentDetails'],
    playlistId: uploadsPlaylistId,
    maxResults: Math.min(Math.max(opts?.maxResults ?? 25, 1), 50),
    pageToken: opts?.pageToken ?? undefined,
  });
  const rawItems = (res.data.items ?? []) as RawPlaylistItem[];
  const items = rawItems
    .map((it) => mapPlaylistItem(it))
    .filter((v): v is NormalizedVideo => v !== null);
  return {
    items,
    nextPageToken: res.data.nextPageToken ?? null,
  };
}
