/**
 * First-frame (near-start) posters from a *local* video File — never from a remote URL.
 * Used so the Media Library can show a real still without downloading the clip.
 */

export class VideoPosterError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'VideoPosterError';
  }
}

export interface VideoPosterResult {
  file: File;
  width: number;
  height: number;
  /** Seconds into the clip where the frame was taken. */
  captureTime: number;
  durationSeconds: number | null;
}

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

function posterName(videoName: string): string {
  const base = videoName.replace(/\.[^/.]+$/, '') || 'video';
  return `${base}-poster.jpg`;
}

function waitEvent(target: EventTarget, ok: string, fail: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Upload cancelled.', 'AbortError'));
      return;
    }
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onFail = () => {
      cleanup();
      reject(new VideoPosterError('Couldn’t read this video to make a poster.'));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Upload cancelled.', 'AbortError'));
    };
    const cleanup = () => {
      target.removeEventListener(ok, onOk);
      target.removeEventListener(fail, onFail);
      signal?.removeEventListener('abort', onAbort);
    };
    target.addEventListener(ok, onOk, { once: true });
    target.addEventListener(fail, onFail, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Capture a representative still from a local video file.
 * Seeks a short way in (≤1s) so the first frame isn’t always black.
 */
export async function extractVideoPoster(
  file: File,
  opts?: { signal?: AbortSignal; maxEdge?: number; quality?: number }
): Promise<VideoPosterResult> {
  if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm)$/i.test(file.name)) {
    throw new VideoPosterError('Only video files can produce a poster.');
  }
  if (opts?.signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', 'true');

  try {
    const loaded = waitEvent(video, 'loadeddata', 'error', opts?.signal);
    video.src = url;
    await loaded;

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;
    const captureTime = duration == null ? 0 : Math.min(1, Math.max(0, duration * 0.08));

    if (captureTime > 0) {
      const seeked = waitEvent(video, 'seeked', 'error', opts?.signal);
      video.currentTime = captureTime;
      await seeked;
    }
    if (opts?.signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) throw new VideoPosterError('This video has no picture frames to poster.');

    const maxEdge = opts?.maxEdge ?? MAX_EDGE;
    const scale = Math.min(1, maxEdge / Math.max(vw, vh));
    const width = Math.max(1, Math.round(vw * scale));
    const height = Math.max(1, Math.round(vh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new VideoPosterError('Couldn’t draw a poster from this video.');
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', opts?.quality ?? JPEG_QUALITY)
    );
    if (!blob || !blob.size) throw new VideoPosterError('The poster came out empty.');

    return {
      file: new File([blob], posterName(file.name), { type: 'image/jpeg', lastModified: Date.now() }),
      width,
      height,
      captureTime,
      durationSeconds: duration,
    };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** True when a thumbnail_url is a still image, not another video file. */
export function isStillPosterUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}
