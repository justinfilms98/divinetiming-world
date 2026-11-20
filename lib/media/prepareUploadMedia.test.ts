import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  convertHeic: vi.fn(),
  isHeic: vi.fn(),
  compressImage: vi.fn(),
  compressMedia: vi.fn(),
  willCompress: vi.fn(),
  readImageSize: vi.fn(),
  extractPoster: vi.fn(),
}));

vi.mock('@/lib/media/heic', () => ({
  convertHeicToJpegIfNeeded: mocks.convertHeic,
  isHeicSource: mocks.isHeic,
  HeicConversionError: class HeicConversionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'HeicConversionError';
    }
  },
}));

vi.mock('@/lib/utils/compressMedia', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils/compressMedia')>('@/lib/utils/compressMedia');
  return {
    ...actual,
    compressImage: mocks.compressImage,
    compressMedia: mocks.compressMedia,
    willCompress: mocks.willCompress,
  };
});

vi.mock('@/lib/media/imageMeta', () => ({
  readImageSize: mocks.readImageSize,
}));

vi.mock('@/lib/media/videoPoster', () => ({
  extractVideoPoster: mocks.extractPoster,
  VideoPosterError: class VideoPosterError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'VideoPosterError';
    }
  },
}));

const { prepareUploadMedia } = await import('@/lib/media/prepareUploadMedia');

const MB = 1024 * 1024;
const jpeg = (bytes = 100) => new File([new Uint8Array(bytes)], 'shot.jpg', { type: 'image/jpeg' });
const mp4 = (bytes = 100) => new File([new Uint8Array(bytes)], 'clip.mp4', { type: 'video/mp4' });

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.isHeic.mockResolvedValue(false);
  mocks.willCompress.mockReturnValue(false);
  mocks.readImageSize.mockResolvedValue({ width: 800, height: 600 });
});

describe('prepareUploadMedia', () => {
  it('converts HEIC then optimizes the JPEG', async () => {
    const heic = new File([new Uint8Array(2 * MB)], 'IMG.HEIC', { type: 'image/heic' });
    const asJpeg = jpeg(1 * MB);
    const optimized = jpeg(400_000);
    mocks.isHeic.mockResolvedValue(true);
    mocks.convertHeic.mockResolvedValue({ file: asJpeg, converted: true });
    mocks.willCompress.mockReturnValue(true);
    mocks.compressImage.mockResolvedValue(optimized);
    mocks.readImageSize.mockResolvedValue({ width: 2000, height: 1500 });

    const r = await prepareUploadMedia(heic, {
      preset: 'standard',
      maxBytes: 50 * MB,
      allowOriginal: false,
      skipPoster: true,
    });
    expect(r.kind).toBe('ready');
    if (r.kind !== 'ready') return;
    expect(r.file).toBe(optimized);
    expect(r.note).toMatch(/HEIC/);
    expect(r.width).toBe(2000);
  });

  it('refuses an undecodable HEIC without renaming it to JPEG', async () => {
    const { HeicConversionError } = await import('@/lib/media/heic');
    const heic = new File([new Uint8Array(MB)], 'IMG.HEIC', { type: 'image/heic' });
    mocks.isHeic.mockResolvedValue(true);
    mocks.convertHeic.mockRejectedValue(new HeicConversionError('This HEIC/HEIF photo can’t be converted'));
    const r = await prepareUploadMedia(heic, { preset: 'standard', maxBytes: 50 * MB, allowOriginal: false });
    expect(r).toMatchObject({ kind: 'failed', canUploadOriginal: false });
    expect(mocks.compressImage).not.toHaveBeenCalled();
  });

  it('refuses a corrupted image that has no readable dimensions', async () => {
    mocks.willCompress.mockReturnValue(false);
    mocks.readImageSize.mockResolvedValue(null);
    const bad = new File([new Uint8Array([0xff, 0xd8, 0x00])], 'broken.jpg', { type: 'image/jpeg' });
    const r = await prepareUploadMedia(bad, { preset: 'standard', maxBytes: 50 * MB, allowOriginal: false });
    expect(r).toMatchObject({ kind: 'failed', canUploadOriginal: false });
    expect(String((r as { reason?: string }).reason)).toMatch(/couldn’t be read|corrupted/i);
  });

  it('makes a video poster and still returns the video when poster capture fails', async () => {
    const { VideoPosterError } = await import('@/lib/media/videoPoster');
    mocks.extractPoster.mockRejectedValue(new VideoPosterError('no frames'));
    const r = await prepareUploadMedia(mp4(), { preset: 'standard', maxBytes: 50 * MB, allowOriginal: false });
    expect(r.kind).toBe('ready');
    if (r.kind !== 'ready') return;
    expect(r.poster).toBeNull();
    expect(r.posterNote).toMatch(/No poster/);
  });

  it('attaches a poster file for videos', async () => {
    const poster = jpeg(20_000);
    mocks.extractPoster.mockResolvedValue({
      file: poster,
      width: 1280,
      height: 720,
      captureTime: 0.5,
      durationSeconds: 12,
    });
    const r = await prepareUploadMedia(mp4(), { preset: 'standard', maxBytes: 50 * MB, allowOriginal: false });
    expect(r.kind).toBe('ready');
    if (r.kind !== 'ready') return;
    expect(r.poster).toBe(poster);
    expect(r.width).toBe(1280);
    expect(r.durationSeconds).toBe(12);
  });

  it('honours AbortSignal during prepare', async () => {
    const c = new AbortController();
    c.abort();
    await expect(
      prepareUploadMedia(jpeg(), { preset: 'standard', maxBytes: 50 * MB, allowOriginal: false, signal: c.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
