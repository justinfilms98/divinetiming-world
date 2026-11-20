/**
 * Client-side prepare step before a Media Library (or shared) upload:
 * HEIC → JPEG when the browser can decode it, optimize the image/video,
 * capture dimensions, and extract a local video poster.
 */

import {
  CompressionError,
  compressImage,
  compressMedia,
  formatBytes,
  imageLimitsForPreset,
  willCompress,
  type CompressionPreset,
  type CompressionResult,
} from '@/lib/utils/compressMedia';
import { convertHeicToJpegIfNeeded, HeicConversionError, isHeicSource } from '@/lib/media/heic';
import { readImageSize } from '@/lib/media/imageMeta';
import { extractVideoPoster, VideoPosterError } from '@/lib/media/videoPoster';
import { ORIGINAL_UPLOAD_MAX_BYTES, originalOverrideLimit } from '@/lib/media/uploadPolicy';

export type PreparedMedia =
  | {
      kind: 'ready';
      file: File;
      note: string | null;
      optimized: boolean;
      width: number | null;
      height: number | null;
      /** Local poster file for videos (upload separately). Null when not a video or poster failed. */
      poster: File | null;
      posterNote: string | null;
      /** Measured duration when a video poster was made. Schema has no duration column — informational only. */
      durationSeconds: number | null;
    }
  | {
      kind: 'failed';
      file: File;
      reason: string;
      canUploadOriginal: boolean;
      originalLimit: number;
    };

function aborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
}

export interface PrepareMediaOptions {
  preset: CompressionPreset;
  maxBytes: number;
  allowOriginal: boolean;
  signal?: AbortSignal;
  /** Skip video poster extraction (tests / callers that only need the media file). */
  skipPoster?: boolean;
  onStatus?: (label: string) => void;
}

/**
 * Prepare one file for upload. Never silently substitutes an unoptimized original
 * after a failed encode — that still goes through allowOriginal.
 */
export async function prepareUploadMedia(file: File, opts: PrepareMediaOptions): Promise<PreparedMedia> {
  const limit = originalOverrideLimit(opts.maxBytes);
  aborted(opts.signal);

  let working = file;
  const notes: string[] = [];

  // 1) HEIC → JPEG when needed (and when the browser can decode it).
  if (await isHeicSource(working)) {
    opts.onStatus?.('Converting HEIC photo…');
    aborted(opts.signal);
    if (opts.allowOriginal) {
      // Owner opted out of optimization: still refuse a raw HEIC that we cannot register as JPEG.
      try {
        const heic = await convertHeicToJpegIfNeeded(working, { signal: opts.signal });
        if (heic.converted) {
          working = heic.file;
          notes.push(`${file.name}: converted from HEIC to JPEG`);
        }
      } catch (err) {
        const reason =
          err instanceof HeicConversionError
            ? err.message
            : err instanceof DOMException && err.name === 'AbortError'
              ? err.message
              : `Couldn’t convert this HEIC photo for upload.`;
        if (err instanceof DOMException && err.name === 'AbortError') throw err;
        return { kind: 'failed', file, reason, canUploadOriginal: false, originalLimit: limit };
      }
    } else {
      try {
        const heic = await convertHeicToJpegIfNeeded(working, { signal: opts.signal });
        if (heic.converted) {
          working = heic.file;
          notes.push(`${file.name}: converted from HEIC to JPEG`);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err;
        const reason = err instanceof HeicConversionError ? err.message : `Couldn’t convert this HEIC photo.`;
        return { kind: 'failed', file, reason, canUploadOriginal: false, originalLimit: limit };
      }
    }
  }

  aborted(opts.signal);

  // 2) Optimize (or keep as-is / explicit original).
  let optimized = false;
  if (opts.allowOriginal) {
    if (working.size > limit) {
      return {
        kind: 'failed',
        file,
        reason: `The original is ${formatBytes(working.size)}, over the ${formatBytes(limit)} limit for unoptimized uploads`,
        canUploadOriginal: false,
        originalLimit: limit,
      };
    }
    notes.push(`${working.name}: uploaded without optimization (${formatBytes(working.size)})`);
  } else if (working.type.startsWith('image/') || working.type.startsWith('video/')) {
    try {
      if (working.type.startsWith('image/')) {
        const limits = imageLimitsForPreset(opts.preset);
        const size = await readImageSize(working, opts.signal);
        const longEdge = size ? Math.max(size.width, size.height) : 0;
        const needsResize = longEdge > limits.maxEdge;
        const needsShrink = willCompress(working, opts.preset) || needsResize;
        if (needsShrink) {
          opts.onStatus?.(needsResize ? 'Resizing image for web…' : 'Optimizing image…');
          aborted(opts.signal);
          const out = await compressImage(working, {
            maxSizeMB: limits.maxSizeMB,
            maxWidthOrHeight: limits.maxEdge,
            force: needsResize,
            outputType: working.type === 'image/png' ? 'image/png' : 'image/jpeg',
          });
          if (out.size !== working.size || out.type !== working.type) {
            notes.push(`${file.name}: ${formatBytes(working.size)} → ${formatBytes(out.size)}`);
            working = out;
            optimized = true;
          }
        }
      } else {
        if (willCompress(working, opts.preset)) {
          opts.onStatus?.('Compressing video for web…');
          aborted(opts.signal);
          const result: CompressionResult = await compressMedia(working, {
            preset: opts.preset,
            onProgress: undefined,
          });
          if (result.outcome === 'compressed') {
            notes.push(`${file.name}: ${formatBytes(result.originalBytes)} → ${formatBytes(result.file.size)}`);
            working = result.file;
            optimized = true;
          } else if (result.outcome === 'original-already-optimal') {
            notes.push(`${file.name}: already web-sized (${formatBytes(result.file.size)}), kept as is`);
            optimized = true;
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      const reason =
        err instanceof CompressionError
          ? err.message
          : `Couldn't optimize the file (${err instanceof Error ? err.message : 'unknown error'})`;
      return {
        kind: 'failed',
        file,
        reason,
        canUploadOriginal: file.size <= limit && file.size <= ORIGINAL_UPLOAD_MAX_BYTES,
        originalLimit: limit,
      };
    }
  }

  aborted(opts.signal);

  // 3) Dimensions from the file that will be uploaded.
  let width: number | null = null;
  let height: number | null = null;
  let durationSeconds: number | null = null;
  let poster: File | null = null;
  let posterNote: string | null = null;

  if (working.type.startsWith('image/')) {
    const size = await readImageSize(working, opts.signal);
    width = size?.width ?? null;
    height = size?.height ?? null;
    if (width == null || height == null) {
      return {
        kind: 'failed',
        file,
        reason: `This image couldn’t be read (it may be corrupted or an unsupported format).`,
        canUploadOriginal: false,
        originalLimit: limit,
      };
    }
  } else if (working.type.startsWith('video/') && !opts.skipPoster) {
    opts.onStatus?.('Making video poster…');
    try {
      // Prefer the local file that will be stored (compressed when we have one).
      const still = await extractVideoPoster(working, { signal: opts.signal });
      poster = still.file;
      width = still.width;
      height = still.height;
      durationSeconds = still.durationSeconds;
      posterNote = `poster ${formatBytes(still.file.size)}`;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      // Poster failure must not block the video upload.
      posterNote =
        err instanceof VideoPosterError
          ? `No poster: ${err.message}`
          : 'No poster: couldn’t capture a frame from this video.';
    }
  }

  aborted(opts.signal);

  return {
    kind: 'ready',
    file: working,
    note: notes.length ? notes.join('; ') : null,
    optimized,
    width,
    height,
    poster,
    posterNote,
    durationSeconds,
  };
}
