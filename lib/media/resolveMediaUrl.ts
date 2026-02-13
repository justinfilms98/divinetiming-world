/**
 * Resolve display URL for media - handles both uploaded (direct URL) and external (Drive) assets
 */

import { createClient } from '@/lib/supabase/server';
import { getImageUrl, getThumbnailUrl, getVideoPreviewUrl } from '@/lib/integrations/googleDrive';

export interface ResolvedMedia {
  url: string;
  thumbnailUrl?: string;
  isExternal: boolean;
  mimeType?: string;
}

export async function resolveMediaUrl(
  directUrl: string | null,
  externalAssetId: string | null
): Promise<ResolvedMedia | null> {
  if (externalAssetId) {
    const supabase = await createClient();
    const { data: asset } = await supabase
      .from('external_media_assets')
      .select('provider, file_id, thumbnail_url, mime_type')
      .eq('id', externalAssetId)
      .single();

    if (asset?.provider === 'google_drive') {
      const isVideo = asset.mime_type?.toLowerCase().startsWith('video/');
      const url = isVideo ? getVideoPreviewUrl(asset.file_id) : getImageUrl(asset.file_id);
      const thumbnailUrl = asset.thumbnail_url || getThumbnailUrl(asset.file_id);
      return { url, thumbnailUrl, isExternal: true, mimeType: asset.mime_type };
    }
  }

  if (directUrl) {
    return { url: directUrl, isExternal: false };
  }

  return null;
}

/**
 * Resolve URL for an external asset by ID (for frontend/API)
 */
export async function resolveExternalAsset(assetId: string): Promise<ResolvedMedia | null> {
  const supabase = await createClient();
  const { data: asset } = await supabase
    .from('external_media_assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (!asset) return null;

  if (asset.provider === 'google_drive') {
    const isVideo = asset.mime_type?.toLowerCase().startsWith('video/');
    const url = isVideo ? getVideoPreviewUrl(asset.file_id) : getImageUrl(asset.file_id);
    const thumbnailUrl = asset.thumbnail_url || getThumbnailUrl(asset.file_id);
    return { url, thumbnailUrl, isExternal: true, mimeType: asset.mime_type };
  }

  return null;
}
