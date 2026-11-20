/**
 * Detect and (when the browser can decode them) convert HEIC/HEIF stills to JPEG.
 * No third-party converter: Safari often decodes HEIC natively; Chrome usually cannot.
 * Failures are reported honestly so the owner can export a JPEG from the phone.
 */

export const HEIC_OWNER_HINT =
  'On iPhone: Settings → Camera → Formats → Most Compatible, or share/export the photo as JPEG, then upload again.';

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

/** ftyp brand bytes that mark HEIC/HEIF containers (ISO BMFF). */
const HEIC_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'mif1',
  'msf1',
  'heim',
  'heis',
  'hevm',
  'hevs',
]);

export function isHeicMime(type: string | null | undefined): boolean {
  return !!type && HEIC_TYPES.has(type.toLowerCase());
}

export function isHeicFileName(name: string | null | undefined): boolean {
  return !!name && /\.(heic|heif)$/i.test(name);
}

/** Peek the file header. Returns true only when the container brand is HEIC/HEIF. */
export async function looksLikeHeic(file: Blob): Promise<boolean> {
  if (file.size < 12) return false;
  const buf = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  // [size:4][ftyp:4][brand:4]
  const tag = String.fromCharCode(buf[4]!, buf[5]!, buf[6]!, buf[7]!);
  if (tag !== 'ftyp') return false;
  const brand = String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!);
  if (HEIC_BRANDS.has(brand)) return true;
  // Compatible brands follow; scan a short window.
  for (let i = 16; i + 4 <= buf.length; i += 4) {
    const b = String.fromCharCode(buf[i]!, buf[i + 1]!, buf[i + 2]!, buf[i + 3]!);
    if (HEIC_BRANDS.has(b)) return true;
  }
  return false;
}

export async function isHeicSource(file: File): Promise<boolean> {
  if (isHeicMime(file.type) || isHeicFileName(file.name)) return true;
  return looksLikeHeic(file);
}

export class HeicConversionError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'HeicConversionError';
  }
}

export interface HeicConversionResult {
  file: File;
  /** True when a HEIC/HEIF source was decoded and re-encoded as JPEG. */
  converted: boolean;
}

function jpegName(name: string): string {
  return name.replace(/\.(heic|heif)$/i, '') + '.jpg';
}

/**
 * If the file is HEIC/HEIF, try a native decode → JPEG. Other images are returned unchanged.
 * Never renames a HEIC file to .jpg without decoding it.
 */
export async function convertHeicToJpegIfNeeded(
  file: File,
  opts?: { quality?: number; signal?: AbortSignal }
): Promise<HeicConversionResult> {
  const heic = await isHeicSource(file);
  if (!heic) return { file, converted: false };
  if (opts?.signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');

  let bitmap: ImageBitmap | null = null;
  try {
    try {
      bitmap = await createImageBitmap(file);
    } catch (err) {
      throw new HeicConversionError(
        `This HEIC/HEIF photo can’t be converted in this browser. ${HEIC_OWNER_HINT}`,
        err
      );
    }
    if (opts?.signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
    if (!bitmap.width || !bitmap.height) {
      throw new HeicConversionError(`Couldn’t read this HEIC photo. ${HEIC_OWNER_HINT}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new HeicConversionError(`Couldn’t convert this HEIC photo. ${HEIC_OWNER_HINT}`);
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', opts?.quality ?? 0.92)
    );
    if (!blob || !blob.size) {
      throw new HeicConversionError(`Couldn’t write a JPEG from this HEIC photo. ${HEIC_OWNER_HINT}`);
    }
    return {
      file: new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: Date.now() }),
      converted: true,
    };
  } finally {
    bitmap?.close();
  }
}
