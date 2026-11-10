import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  imageCompression: vi.fn(),
  ffmpegLoad: vi.fn(),
}));

vi.mock('browser-image-compression', () => ({ default: mocks.imageCompression }));
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    load = mocks.ffmpegLoad;
    on() {}
  },
}));
vi.mock('@ffmpeg/util', () => ({ fetchFile: vi.fn(), toBlobURL: vi.fn(async (u: string) => u) }));

const { compressImage, compressMedia, compressVideo, CompressionError } = await import('./compressMedia');

const MB = 1024 * 1024;
const bigImage = () => new File([new Uint8Array(6 * MB)], 'Photo784_Original.jpg', { type: 'image/jpeg' });
const bigVideo = () => new File([new Uint8Array(13 * MB)], 'clip.mov', { type: 'video/quicktime' });

beforeEach(() => {
  mocks.imageCompression.mockReset();
  mocks.ffmpegLoad.mockReset();
});

describe('compression failures never fall back to the original silently', () => {
  it('image: throws CompressionError instead of returning the original', async () => {
    mocks.imageCompression.mockRejectedValue(new Error('canvas out of memory'));
    const file = bigImage();
    await expect(compressImage(file)).rejects.toBeInstanceOf(CompressionError);
    await expect(compressMedia(file)).rejects.toThrow(/canvas out of memory/);
  });

  it('video: throws CompressionError when the compressor cannot load', async () => {
    mocks.ffmpegLoad.mockRejectedValue(new Error('network blocked'));
    await expect(compressVideo(bigVideo())).rejects.toBeInstanceOf(CompressionError);
  });

  it('video: a failed compressor load is retried on the next attempt', async () => {
    mocks.ffmpegLoad.mockRejectedValue(new Error('offline'));
    await expect(compressVideo(bigVideo())).rejects.toThrow();
    await expect(compressVideo(bigVideo())).rejects.toThrow();
    expect(mocks.ffmpegLoad).toHaveBeenCalledTimes(2);
  });

  it('image: explains an unreadable image instead of showing "[object Event]"', async () => {
    mocks.imageCompression.mockRejectedValue(new Event('error'));
    await expect(compressImage(bigImage())).rejects.toThrow(/could not be read/);
    mocks.imageCompression.mockRejectedValue(new Error('[object Event]'));
    await expect(compressImage(bigImage())).rejects.toThrow(/could not be read — it may be damaged/);
  });

  it('image: an empty optimized copy is a failure, not a success', async () => {
    mocks.imageCompression.mockResolvedValue(new File([], 'x.jpg', { type: 'image/jpeg' }));
    await expect(compressImage(bigImage())).rejects.toBeInstanceOf(CompressionError);
  });
});

describe('successful outcomes are reported', () => {
  it('reports a compressed image with its original size', async () => {
    const small = new File([new Uint8Array(1 * MB)], 'p.jpg', { type: 'image/jpeg' });
    mocks.imageCompression.mockResolvedValue(small);
    const r = await compressMedia(bigImage());
    expect(r).toMatchObject({ outcome: 'compressed', originalBytes: 6 * MB });
    expect(r.file).toBe(small);
  });

  it('leaves files under the limit alone and says so', async () => {
    const r = await compressMedia(new File([new Uint8Array(10)], 'tiny.png', { type: 'image/png' }));
    expect(r.outcome).toBe('not-needed');
    expect(mocks.imageCompression).not.toHaveBeenCalled();
  });
});
