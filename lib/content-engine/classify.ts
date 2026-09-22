/**
 * Pure classifier for manually imported URLs. Decides the provider, a stable
 * external identity (for idempotency), and the source/draft types — without any
 * network calls. Used by the manual-import route so that re-pasting the same
 * YouTube video or Instagram post dedupes by identity, not just URL string.
 */

import { extractYouTubeId, inferSourceType, inferDraftType } from './normalize';
import { parseInstagramShortcode, instagramSourceType } from './adapters/instagramNormalize';
import type { DraftType, SourceType } from './types';

export interface ManualClassification {
  provider: string; // 'youtube' | 'instagram' | 'manual'
  /** Stable provider-native id when derivable (enables identity-based dedupe). */
  externalId: string | null;
  sourceType: SourceType;
  draftType: DraftType;
}

/** Classify a pasted URL (or null for title-only manual entries). */
export function classifyManualUrl(url: string | null): ManualClassification {
  if (!url) {
    return { provider: 'manual', externalId: null, sourceType: 'unknown', draftType: 'unknown' };
  }

  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return { provider: 'youtube', externalId: youtubeId, sourceType: 'video', draftType: 'video' };
  }

  const igShortcode = parseInstagramShortcode(url);
  if (igShortcode) {
    const sourceType = instagramSourceType(url) ?? 'post';
    return {
      provider: 'instagram',
      externalId: igShortcode,
      sourceType,
      draftType: inferDraftType(sourceType),
    };
  }

  const sourceType = inferSourceType(url);
  return { provider: 'manual', externalId: null, sourceType, draftType: inferDraftType(sourceType) };
}
