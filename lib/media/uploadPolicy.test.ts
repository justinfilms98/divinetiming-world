import { describe, expect, it, vi } from 'vitest';

vi.mock('browser-image-compression', () => ({ default: vi.fn() }));
vi.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: class {} }));
vi.mock('@ffmpeg/util', () => ({ fetchFile: vi.fn(), toBlobURL: vi.fn() }));

const { CompressionError } = await import('@/lib/utils/compressMedia');
const { isAcceptedFile, ORIGINAL_UPLOAD_MAX_BYTES, prepareFileForUpload } = await import('./uploadPolicy');

const MB = 1024 * 1024;
const file = (name: string, type: string, bytes: number) => new File([new Uint8Array(bytes)], name, { type });
const base = { compress: true, preset: 'standard' as const, maxBytes: 100 * MB, allowOriginal: false };
const failing = async () => {
  throw new CompressionError("Couldn't optimize the video (out of memory)", 'clip.mov');
};

describe('prepareFileForUpload', () => {
  it('a compression failure is reported and the original is NOT returned for upload', async () => {
    const original = file('clip.mov', 'video/quicktime', 20 * MB);
    const r = await prepareFileForUpload(original, { ...base, compressFn: failing });
    expect(r.kind).toBe('failed');
    expect(r).toMatchObject({ reason: expect.stringMatching(/out of memory/), canUploadOriginal: true });
  });

  it('uploads the original only after the owner explicitly chooses it, and labels it', async () => {
    const original = file('clip.mov', 'video/quicktime', 20 * MB);
    const compressFn = vi.fn(failing);
    const r = await prepareFileForUpload(original, { ...base, allowOriginal: true, compressFn });
    expect(r).toMatchObject({ kind: 'ready', optimized: false, note: expect.stringMatching(/without optimization/) });
    expect(r.kind === 'ready' && r.file).toBe(original);
    expect(compressFn).not.toHaveBeenCalled();
  });

  it('never offers an unoptimized upload above 50 MB', async () => {
    const huge = file('raw.mov', 'video/quicktime', ORIGINAL_UPLOAD_MAX_BYTES + 1);
    expect(await prepareFileForUpload(huge, { ...base, compressFn: failing })).toMatchObject({ kind: 'failed', canUploadOriginal: false });
    expect(await prepareFileForUpload(huge, { ...base, allowOriginal: true, compressFn: failing })).toMatchObject({ kind: 'failed', canUploadOriginal: false });
  });

  it('treats unexpected errors from the compressor as failures too', async () => {
    const r = await prepareFileForUpload(file('p.jpg', 'image/jpeg', 6 * MB), {
      ...base,
      compressFn: async () => {
        throw new TypeError('boom');
      },
    });
    expect(r).toMatchObject({ kind: 'failed', reason: expect.stringMatching(/boom/) });
  });

  it('passes through small files and reports successful compression', async () => {
    const small = file('s.jpg', 'image/jpeg', 100);
    expect(await prepareFileForUpload(small, { ...base, compressFn: failing })).toMatchObject({ kind: 'ready', file: small });
    const out = file('p.jpg', 'image/jpeg', 1 * MB);
    const r = await prepareFileForUpload(file('p.jpg', 'image/jpeg', 6 * MB), {
      ...base,
      compressFn: async () => ({ file: out, outcome: 'compressed', originalBytes: 6 * MB }),
    });
    expect(r).toMatchObject({ kind: 'ready', file: out, optimized: true, note: expect.stringContaining('→') });
  });
});

describe('isAcceptedFile', () => {
  it('rejects a video dropped on an image-only uploader', () => {
    expect(isAcceptedFile(file('v.mp4', 'video/mp4', 1), ['image'])).toBe(false);
    expect(isAcceptedFile(file('i.jpg', 'image/jpeg', 1), ['image'])).toBe(true);
  });

  it('honours an exact MIME override such as PNG-only logos', () => {
    expect(isAcceptedFile(file('l.png', 'image/png', 1), ['image'], 'image/png')).toBe(true);
    expect(isAcceptedFile(file('l.jpg', 'image/jpeg', 1), ['image'], 'image/png')).toBe(false);
  });
});
