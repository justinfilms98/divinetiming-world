/**
 * Upload rules shared by the admin uploader: type checks and what happens when optimization fails.
 * Pure (the compressor is injected) so it is unit-testable.
 */

import type { CompressionPreset, CompressionResult } from '@/lib/utils/compressMedia';
import { CompressionError, formatBytes, willCompress } from '@/lib/utils/compressMedia';

/** Supabase per-file limit; also the cap for an explicitly chosen unoptimized upload. */
export const ORIGINAL_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

type FileLike = Pick<File, 'name' | 'type' | 'size'>;

/** Whether a picked or dropped file matches the uploader's accepted types. */
export function isAcceptedFile(file: FileLike, acceptedTypes: ('image' | 'video')[], acceptOverride?: string): boolean {
  const t = (file.type || '').toLowerCase();
  if (acceptOverride) {
    return acceptOverride
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .some((a) => a === t || a === '*/*' || (a.endsWith('/*') && t.startsWith(a.slice(0, -1))));
  }
  return acceptedTypes.some((kind) => t.startsWith(`${kind}/`));
}

export function originalOverrideLimit(maxBytes: number): number {
  return Math.min(maxBytes, ORIGINAL_UPLOAD_MAX_BYTES);
}

export type PreparedUpload =
  | { kind: 'ready'; file: File; note: string | null; optimized: boolean }
  | { kind: 'failed'; file: File; reason: string; canUploadOriginal: boolean; originalLimit: number };

export interface PrepareOptions {
  compress: boolean;
  preset: CompressionPreset;
  maxBytes: number;
  /** The owner explicitly chose "Upload original (not optimized)" for this file. */
  allowOriginal: boolean;
  compressFn: (file: File) => Promise<CompressionResult>;
}

/**
 * Optimize one file before upload. A failed optimization is reported, never replaced by the original;
 * the original is used only when `allowOriginal` is set, and only within the size limit.
 */
export async function prepareFileForUpload(file: File, opts: PrepareOptions): Promise<PreparedUpload> {
  const limit = originalOverrideLimit(opts.maxBytes);
  const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/');
  if (!opts.compress || !isMedia || !willCompress(file, opts.preset)) {
    return { kind: 'ready', file, note: null, optimized: false };
  }
  if (opts.allowOriginal) {
    if (file.size > limit) {
      return { kind: 'failed', file, reason: `The original is ${formatBytes(file.size)}, over the ${formatBytes(limit)} limit for unoptimized uploads`, canUploadOriginal: false, originalLimit: limit };
    }
    return { kind: 'ready', file, note: `${file.name}: uploaded without optimization (${formatBytes(file.size)})`, optimized: false };
  }
  try {
    const result = await opts.compressFn(file);
    if (result.outcome === 'compressed') {
      return { kind: 'ready', file: result.file, note: `${file.name}: ${formatBytes(result.originalBytes)} → ${formatBytes(result.file.size)}`, optimized: true };
    }
    if (result.outcome === 'original-already-optimal') {
      return { kind: 'ready', file: result.file, note: `${file.name}: already web-sized (${formatBytes(result.file.size)}), kept as is`, optimized: true };
    }
    return { kind: 'ready', file: result.file, note: null, optimized: false };
  } catch (err) {
    const reason = err instanceof CompressionError ? err.message : `Couldn't optimize the file (${err instanceof Error ? err.message : 'unknown error'})`;
    return { kind: 'failed', file, reason, canUploadOriginal: file.size <= limit, originalLimit: limit };
  }
}
