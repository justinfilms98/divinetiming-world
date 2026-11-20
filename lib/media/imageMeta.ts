/**
 * Read pixel size from a local image File (after HEIC conversion / compression).
 * Uses createImageBitmap so EXIF-oriented browsers report the upright size.
 */

export interface ImageSize {
  width: number;
  height: number;
}

export async function readImageSize(file: Blob, signal?: AbortSignal): Promise<ImageSize | null> {
  if (signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
  try {
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height) return null;
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  } catch {
    // Fallback for environments without createImageBitmap for this type.
    return readImageSizeViaElement(file, signal);
  }
}

function readImageSizeViaElement(file: Blob, signal?: AbortSignal): Promise<ImageSize | null> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Upload cancelled.', 'AbortError'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Upload cancelled.', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    img.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      cleanup();
      resolve(img.naturalWidth && img.naturalHeight ? { width: img.naturalWidth, height: img.naturalHeight } : null);
    };
    img.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      cleanup();
      resolve(null);
    };
    img.src = url;
  });
}

/** Server-side bounds for client-reported dimensions (reject absurd values). */
export const MAX_REPORTED_DIMENSION = 20000;

export function sanitizeReportedDimensions(
  width: unknown,
  height: unknown
): { width: number | null; height: number | null } {
  const w = typeof width === 'number' && Number.isInteger(width) ? width : null;
  const h = typeof height === 'number' && Number.isInteger(height) ? height : null;
  if (w == null || h == null || w < 1 || h < 1 || w > MAX_REPORTED_DIMENSION || h > MAX_REPORTED_DIMENSION) {
    return { width: null, height: null };
  }
  return { width: w, height: h };
}
