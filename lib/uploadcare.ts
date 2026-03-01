/**
 * Shared Uploadcare upload helper for client-side use.
 * Use from admin upload flows so all uploads behave the same and return a consistent shape.
 * Requires NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY.
 */

export interface UploadResult {
  url: string;
  uuid: string;
  filename: string;
  mimeType: string;
  size: number;
}

export async function uploadOne(
  file: File,
  opts: { publicKey: string; onProgress?: (percent: number) => void }
): Promise<UploadResult> {
  const { uploadFile } = await import('@uploadcare/upload-client');
  const uc = await uploadFile(file, {
    publicKey: opts.publicKey,
    store: 'auto',
    onProgress:
      opts.onProgress != null
        ? (p) => {
            if (p.isComputable) opts.onProgress!(p.value);
          }
        : undefined,
  });
  return {
    url: uc.cdnUrl,
    uuid: uc.uuid,
    filename: uc.originalFilename || uc.name || file.name || '',
    mimeType: uc.mimeType || 'application/octet-stream',
    size: uc.size ?? 0,
  };
}

/** Get public key from env (client-side). */
export function getUploadcarePublicKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ||
    (process.env as Record<string, string>).UPLOADCARE_PUBLIC_KEY ||
    ''
  );
}
