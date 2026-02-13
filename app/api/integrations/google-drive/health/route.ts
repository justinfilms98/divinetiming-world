import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkFileAccessible, extractFileIdFromUrl } from '@/lib/integrations/googleDrive';

/**
 * Health-check: verify a Drive asset is accessible.
 * Used by MediaAssetRenderer for Drive videos (iframe has no onError).
 * Accepts assetId or url.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, url } = body as { assetId?: string; url?: string };

    let fileId: string | null = null;

    if (assetId) {
      const supabase = await createClient();
      const { data: asset } = await supabase
        .from('external_media_assets')
        .select('file_id')
        .eq('id', assetId)
        .single();
      fileId = asset?.file_id ?? null;
    } else if (url && typeof url === 'string') {
      fileId = extractFileIdFromUrl(url);
    }

    if (!fileId) {
      return NextResponse.json({ accessible: false, error: 'Could not resolve file ID' }, { status: 400 });
    }

    const accessible = await checkFileAccessible(fileId);
    return NextResponse.json({ accessible });
  } catch (err: any) {
    console.error('Drive health-check error:', err);
    return NextResponse.json(
      { accessible: false, error: err.message || 'Check failed' },
      { status: 500 }
    );
  }
}
