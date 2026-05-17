/**
 * Client-side Supabase Storage upload for media library.
 * Replaces Uploadcare; uploads go to the public "media" bucket.
 */

import { createClient } from '@/lib/supabase/client';

const BUCKET = 'media';

export interface SupabaseUploadResult {
  storage_path: string;
  public_url: string;
  name: string;
  mimeType: string;
  size: number;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

/**
 * Upload a file to Supabase storage (media bucket). Returns path and public URL.
 * Caller should then register via /api/admin/media/register with provider 'supabase'.
 */
export async function uploadToSupabase(
  file: File,
  opts?: { onProgress?: (percent: number) => void }
): Promise<SupabaseUploadResult> {
  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const base = sanitizeFileName(file.name.replace(/\.[^.]+$/, '') || 'file');
  const storagePath = `library/${Date.now()}-${base}.${ext}`;

  if (opts?.onProgress) opts.onProgress(10);

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });

  if (opts?.onProgress) opts.onProgress(90);

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const public_url = urlData?.publicUrl ?? '';

  if (opts?.onProgress) opts.onProgress(100);

  return {
    storage_path: storagePath,
    public_url,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };
}
