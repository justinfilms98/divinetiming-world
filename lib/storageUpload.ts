/**
 * Hero media upload to Supabase Storage (bucket: media).
 * Client-side: validate file and call admin API. Server API performs upload and DB update.
 */

export const HERO_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const HERO_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type HeroUploadType = 'media' | 'logo';

function getExtension(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'webp';
}

/**
 * Client-side validation. Rejects if type not allowed or file > 10MB.
 * Returns error message or null if valid.
 */
export function validateHeroFile(file: File, _type: HeroUploadType): string | null {
  if (!HERO_ALLOWED_TYPES.includes(file.type as (typeof HERO_ALLOWED_TYPES)[number])) {
    return `Allowed types: ${HERO_ALLOWED_TYPES.join(', ')}`;
  }
  if (file.size > HERO_UPLOAD_MAX_BYTES) {
    return `File must be under ${HERO_UPLOAD_MAX_BYTES / 1024 / 1024}MB`;
  }
  return null;
}

/**
 * Upload hero image to Supabase Storage and update hero_sections.
 * Call from admin only (API enforces requireAdmin).
 * @param page_slug - e.g. 'home', 'events'
 * @param file - image file (png, jpeg, webp; max 10MB)
 * @param type - 'media' for hero image, 'logo' for hero logo
 * @returns { storagePath, url } or throws with message
 */
export async function updateHeroMedia(
  page_slug: string,
  file: File,
  type: HeroUploadType
): Promise<{ storagePath: string; url: string }> {
  const err = validateHeroFile(file, type);
  if (err) throw new Error(err);

  const form = new FormData();
  form.set('page_slug', page_slug);
  form.set('type', type);
  form.set('file', file);

  const res = await fetch('/api/admin/hero/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Upload failed');
  return { storagePath: data.storagePath, url: data.url };
}
