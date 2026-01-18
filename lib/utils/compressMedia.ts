import imageCompression from 'browser-image-compression';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Supabase typically allows up to 50MB, but we'll target smaller for better performance
const MAX_IMAGE_SIZE_MB = 5; // 5MB for images
const MAX_VIDEO_SIZE_MB = 50; // 50MB for videos (Supabase limit)
const MAX_IMAGE_WIDTH = 1920; // Max width for hero images
const MAX_IMAGE_HEIGHT = 1080; // Max height for hero images

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

/**
 * Compress an image file to fit within size limits
 */
export async function compressImage(file: File): Promise<File> {
  const fileSizeMB = file.size / (1024 * 1024);

  // If already under limit, return as-is
  if (fileSizeMB <= MAX_IMAGE_SIZE_MB) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: MAX_IMAGE_SIZE_MB,
      maxWidthOrHeight: Math.max(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT),
      useWebWorker: true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, return original (upload will fail if too large)
    return file;
  }
}

/**
 * Load FFmpeg instance (lazy load)
 */
async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  
  // Load FFmpeg core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  ffmpegLoaded = true;
  return ffmpeg;
}

/**
 * Compress a video file if it's too large using FFmpeg
 */
export async function compressVideo(file: File, onProgress?: (progress: number) => void): Promise<File> {
  const fileSizeMB = file.size / (1024 * 1024);

  // If already under limit, return as-is
  if (fileSizeMB <= MAX_VIDEO_SIZE_MB) {
    return file;
  }

  try {
    onProgress?.(10);
    const ffmpeg = await loadFFmpeg();
    
    onProgress?.(20);
    
    // Write input file to FFmpeg
    const inputFileName = 'input.' + file.name.split('.').pop();
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    
    onProgress?.(30);
    
    // Calculate target bitrate to get under 50MB
    // Rough estimate: target size * 8 / duration (in seconds)
    // We'll use a conservative bitrate
    const targetBitrate = Math.floor((MAX_VIDEO_SIZE_MB * 8 * 1024 * 1024) / 60); // Assume ~60s video, adjust as needed
    
    // Set up progress callback
    ffmpeg.on('progress', ({ progress }) => {
      const progressPercent = 30 + (progress * 0.6 * 100); // 30-90%
      onProgress?.(Math.min(progressPercent, 90));
    });
    
    // Compress video with H.264 codec
    const outputFileName = 'output.mp4';
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '28', // Higher CRF = more compression (18-28 is good range)
      '-maxrate', `${targetBitrate}`,
      '-bufsize', `${targetBitrate * 2}`,
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease', // Max 1080p
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputFileName,
    ]);
    
    onProgress?.(95);
    
    // Read compressed file
    const data = await ffmpeg.readFile(outputFileName);
    // Convert FileData to Uint8Array to ensure proper BlobPart type
    // FileData can be string | Uint8Array, but for binary video files it's Uint8Array
    if (data instanceof Uint8Array) {
      // Already a Uint8Array, use directly
      const compressedBlob = new Blob([data], { type: 'video/mp4' });
      // Clean up
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      
      onProgress?.(100);
      
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.mp4'), {
        type: 'video/mp4',
      });
      
      // If still too large, return original (compression didn't help enough)
      const compressedSizeMB = compressedFile.size / (1024 * 1024);
      if (compressedSizeMB > MAX_VIDEO_SIZE_MB * 1.1) {
        console.warn(`Compressed video is still ${compressedSizeMB.toFixed(2)}MB. Original file may be too large to compress effectively.`);
        return file;
      }
      
      return compressedFile;
    } else {
      // Should not happen for binary video files, but handle it
      throw new Error('Expected Uint8Array from FFmpeg readFile for video file');
    }
  } catch (error) {
    console.error('Video compression error:', error);
    // If compression fails, return original
    return file;
  }
}

/**
 * Compress media file (image or video) automatically
 */
export async function compressMedia(file: File, onProgress?: (progress: number) => void): Promise<File> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (isImage) {
    return compressImage(file);
  } else if (isVideo) {
    return compressVideo(file, onProgress);
  }

  // Unknown type, return as-is
  return file;
}
