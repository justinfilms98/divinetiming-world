import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type CompressionPreset = 'hero' | 'standard';

/** Optimization could not be completed. The caller must not upload the original in its place silently. */
export class CompressionError extends Error {
  constructor(
    message: string,
    readonly fileName: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CompressionError';
  }
}

export type CompressionOutcome =
  /** An optimized copy replaced the original. */
  | 'compressed'
  /** Already within limits for this preset; nothing to do. */
  | 'not-needed'
  /** Optimized, but the copy was not meaningfully smaller, so the (equally small) original is used. */
  | 'original-already-optimal';

export interface CompressionResult {
  file: File;
  outcome: CompressionOutcome;
  originalBytes: number;
}

const UNREADABLE = 'the file could not be read — it may be damaged or in an unsupported format';

function reason(err: unknown): string {
  // Image decoders reject with a DOM Event, or an Error whose message is just "[object Event]",
  // when the file isn't a readable image.
  if (typeof Event !== 'undefined' && err instanceof Event) return UNREADABLE;
  const msg = (err instanceof Error ? err.message : typeof err === 'string' ? err : '').trim();
  if (/^\[object \w+\]$/.test(msg)) return UNREADABLE;
  return msg || 'unknown error';
}

export type CompressionPresetConfig = {
  /** Compress videos at or above this size */
  videoCompressAboveBytes: number;
  /** Target output size (soft cap for bitrate math) */
  videoTargetBytes: number;
  maxWidth: number;
  maxHeight: number;
  crf: string;
};

export const COMPRESSION_PRESETS: Record<CompressionPreset, CompressionPresetConfig> = {
  hero: {
    videoCompressAboveBytes: 3 * 1024 * 1024,
    videoTargetBytes: 8 * 1024 * 1024,
    maxWidth: 1280,
    maxHeight: 720,
    crf: '26',
  },
  standard: {
    videoCompressAboveBytes: 12 * 1024 * 1024,
    videoTargetBytes: 20 * 1024 * 1024,
    maxWidth: 1920,
    maxHeight: 1080,
    crf: '28',
  },
};

/** Soft size target after re-encode (also used as "already small enough" when under the long-edge cap). */
const DEFAULT_IMAGE_MAX_MB = 1.5;
const HERO_IMAGE_MAX_MB = 2;
/** Long edge for library / Journal / Collections images. */
const DEFAULT_IMAGE_MAX_DIMENSION = 2560;
/** Slightly larger allowance for homepage hero stills. */
const HERO_IMAGE_MAX_DIMENSION = 2880;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getVideoDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 30;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata'));
    };
    video.src = url;
  });
}

export type CompressImageOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  /** When true, re-encode even if the file is under the size cap (e.g. a huge long edge). */
  force?: boolean;
  /** Prefer JPEG so EXIF (including GPS) is stripped by the re-encode. */
  outputType?: string;
};

async function compressImageDetailed(
  file: File,
  options?: CompressImageOptions
): Promise<CompressionResult> {
  const maxSizeMB = options?.maxSizeMB ?? DEFAULT_IMAGE_MAX_MB;
  const maxEdge = options?.maxWidthOrHeight ?? DEFAULT_IMAGE_MAX_DIMENSION;
  if (!options?.force && file.size / (1024 * 1024) <= maxSizeMB) {
    return { file, outcome: 'not-needed', originalBytes: file.size };
  }

  let compressed: File;
  try {
    // Re-encoding through the library applies EXIF orientation and drops GPS / camera tags.
    compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: maxEdge,
      useWebWorker: true,
      fileType: options?.outputType ?? (file.type === 'image/png' ? 'image/png' : 'image/jpeg'),
      initialQuality: 0.82,
    });
  } catch (error) {
    console.error('Image compression error:', error);
    throw new CompressionError(`Couldn't optimize the image (${reason(error)})`, file.name, error);
  }
  if (!compressed || !compressed.size) {
    throw new CompressionError("Couldn't optimize the image (the optimized copy was empty)", file.name);
  }
  if (compressed.size >= file.size * 0.98 && !options?.force) {
    return { file, outcome: 'original-already-optimal', originalBytes: file.size };
  }
  return { file: compressed, outcome: 'compressed', originalBytes: file.size };
}

/**
 * Compress an image file to fit within size limits.
 * Throws CompressionError on failure; never returns the original in place of a failed optimization.
 */
export async function compressImage(file: File, options?: CompressImageOptions): Promise<File> {
  return (await compressImageDetailed(file, options)).file;
}

export function imageLimitsForPreset(preset: CompressionPreset): { maxSizeMB: number; maxEdge: number } {
  return preset === 'hero'
    ? { maxSizeMB: HERO_IMAGE_MAX_MB, maxEdge: HERO_IMAGE_MAX_DIMENSION }
    : { maxSizeMB: DEFAULT_IMAGE_MAX_MB, maxEdge: DEFAULT_IMAGE_MAX_DIMENSION };
}

async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance;
  }
  if (ffmpegLoadPromise) {
    return ffmpegLoadPromise;
  }

  ffmpegLoadPromise = (async () => {
    onProgress?.(5);
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegInstance = ffmpeg;
    ffmpegLoaded = true;
    return ffmpeg;
  })().catch((err) => {
    // Let "Try again" reload the compressor instead of reusing a failed load.
    ffmpegLoadPromise = null;
    throw err;
  });

  return ffmpegLoadPromise;
}

export interface CompressVideoOptions {
  preset?: CompressionPreset;
  onProgress?: (progress: number) => void;
}

async function compressVideoDetailed(file: File, options?: CompressVideoOptions): Promise<CompressionResult> {
  const preset = options?.preset ?? 'standard';
  const config = COMPRESSION_PRESETS[preset];
  const onProgress = options?.onProgress;

  if (file.size <= config.videoCompressAboveBytes) {
    return { file, outcome: 'not-needed', originalBytes: file.size };
  }

  try {
    onProgress?.(8);
    const durationSec = await getVideoDurationSec(file).catch(() => 30);
    const ffmpeg = await loadFFmpeg(onProgress);

    onProgress?.(15);

    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputFileName = `input.${inputExt}`;
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    onProgress?.(22);

    const targetBitrateKbps = Math.max(
      400,
      Math.floor((config.videoTargetBytes * 8) / durationSec / 1000)
    );

    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.(22 + Math.min(progress, 1) * 68);
    });

    const outputFileName = 'output.mp4';
    const scaleFilter = `scale=${config.maxWidth}:${config.maxHeight}:force_original_aspect_ratio=decrease`;

    await ffmpeg.exec([
      '-i',
      inputFileName,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      config.crf,
      '-maxrate',
      `${targetBitrateKbps}k`,
      '-bufsize',
      `${targetBitrateKbps * 2}k`,
      '-vf',
      scaleFilter,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputFileName,
    ]);

    onProgress?.(92);

    const data = await ffmpeg.readFile(outputFileName);
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    if (!(data instanceof Uint8Array)) {
      throw new Error('Expected binary output from FFmpeg');
    }

    const compressedBlob = new Blob([data.slice()], { type: 'video/mp4' });
    onProgress?.(100);

    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, '.mp4'),
      { type: 'video/mp4' }
    );

    if (!compressedFile.size) {
      throw new Error('the optimized copy was empty');
    }
    if (compressedFile.size >= file.size * 0.95) {
      // The encode worked; the source is already as small as our web settings would make it.
      return { file, outcome: 'original-already-optimal', originalBytes: file.size };
    }

    return { file: compressedFile, outcome: 'compressed', originalBytes: file.size };
  } catch (error) {
    console.error('Video compression error:', error);
    throw new CompressionError(`Couldn't optimize the video (${reason(error)})`, file.name, error);
  }
}

/**
 * Compress a video for web delivery (H.264, faststart, scaled).
 * Skips compression when the file is already small for the preset.
 * Throws CompressionError on failure; never returns the original in place of a failed optimization.
 */
export async function compressVideo(file: File, options?: CompressVideoOptions): Promise<File> {
  return (await compressVideoDetailed(file, options)).file;
}

export interface CompressMediaOptions {
  preset?: CompressionPreset;
  onProgress?: (progress: number) => void;
  imageMaxSizeMB?: number;
}

/**
 * Compress media file (image or video) before upload, reporting what happened.
 * Throws CompressionError when optimization fails.
 */
export async function compressMedia(file: File, options?: CompressMediaOptions): Promise<CompressionResult> {
  if (file.type.startsWith('image/')) {
    const limits = imageLimitsForPreset(options?.preset ?? 'standard');
    return compressImageDetailed(file, {
      maxSizeMB: options?.imageMaxSizeMB ?? limits.maxSizeMB,
      maxWidthOrHeight: limits.maxEdge,
    });
  }
  if (file.type.startsWith('video/')) {
    return compressVideoDetailed(file, { preset: options?.preset, onProgress: options?.onProgress });
  }
  return { file, outcome: 'not-needed', originalBytes: file.size };
}

/** Whether this file would be compressed for the given preset (size only; callers may also force on long edge). */
export function willCompress(file: File, preset: CompressionPreset = 'standard'): boolean {
  if (file.type.startsWith('image/')) {
    return file.size > imageLimitsForPreset(preset).maxSizeMB * 1024 * 1024;
  }
  if (file.type.startsWith('video/')) {
    return file.size > COMPRESSION_PRESETS[preset].videoCompressAboveBytes;
  }
  return false;
}
