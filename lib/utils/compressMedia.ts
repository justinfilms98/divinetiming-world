import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type CompressionPreset = 'hero' | 'standard';

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

const DEFAULT_IMAGE_MAX_MB = 5;
const DEFAULT_IMAGE_MAX_DIMENSION = 1920;

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

/**
 * Compress an image file to fit within size limits
 */
export async function compressImage(
  file: File,
  options?: { maxSizeMB?: number; maxWidthOrHeight?: number }
): Promise<File> {
  const maxSizeMB = options?.maxSizeMB ?? DEFAULT_IMAGE_MAX_MB;
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB <= maxSizeMB) {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: options?.maxWidthOrHeight ?? DEFAULT_IMAGE_MAX_DIMENSION,
      useWebWorker: true,
      fileType: file.type,
    });
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    return file;
  }
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
  })();

  return ffmpegLoadPromise;
}

export interface CompressVideoOptions {
  preset?: CompressionPreset;
  onProgress?: (progress: number) => void;
}

/**
 * Compress a video for web delivery (H.264, faststart, scaled).
 * Skips compression when the file is already small for the preset.
 */
export async function compressVideo(file: File, options?: CompressVideoOptions): Promise<File> {
  const preset = options?.preset ?? 'standard';
  const config = COMPRESSION_PRESETS[preset];
  const onProgress = options?.onProgress;

  if (file.size <= config.videoCompressAboveBytes) {
    return file;
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

    if (compressedFile.size >= file.size * 0.95) {
      console.warn(
        `Video compression did not reduce size meaningfully (${formatBytes(file.size)} → ${formatBytes(compressedFile.size)}). Using original.`
      );
      return file;
    }

    return compressedFile;
  } catch (error) {
    console.error('Video compression error:', error);
    return file;
  }
}

export interface CompressMediaOptions {
  preset?: CompressionPreset;
  onProgress?: (progress: number) => void;
  imageMaxSizeMB?: number;
}

/**
 * Compress media file (image or video) before upload.
 */
export async function compressMedia(file: File, options?: CompressMediaOptions): Promise<File> {
  if (file.type.startsWith('image/')) {
    return compressImage(file, {
      maxSizeMB: options?.imageMaxSizeMB,
    });
  }
  if (file.type.startsWith('video/')) {
    return compressVideo(file, {
      preset: options?.preset,
      onProgress: options?.onProgress,
    });
  }
  return file;
}

/** Whether this file would be compressed for the given preset */
export function willCompress(file: File, preset: CompressionPreset = 'standard'): boolean {
  if (file.type.startsWith('image/')) {
    const maxMb = preset === 'hero' ? 2 : DEFAULT_IMAGE_MAX_MB;
    return file.size > maxMb * 1024 * 1024;
  }
  if (file.type.startsWith('video/')) {
    return file.size > COMPRESSION_PRESETS[preset].videoCompressAboveBytes;
  }
  return false;
}
