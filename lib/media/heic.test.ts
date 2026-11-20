import { describe, expect, it } from 'vitest';
import { isHeicFileName, isHeicMime, looksLikeHeic } from '@/lib/media/heic';

function ftypBlob(brand: string, compat: string[] = []): Blob {
  const brands = [brand, ...compat];
  const size = 8 + brands.length * 4;
  const buf = new Uint8Array(size);
  buf[0] = 0;
  buf[1] = 0;
  buf[2] = 0;
  buf[3] = size;
  buf.set([0x66, 0x74, 0x79, 0x70], 4); // ftyp
  brands.forEach((b, i) => {
    const o = 8 + i * 4;
    buf[o] = b.charCodeAt(0);
    buf[o + 1] = b.charCodeAt(1);
    buf[o + 2] = b.charCodeAt(2);
    buf[o + 3] = b.charCodeAt(3);
  });
  return new Blob([buf]);
}

describe('HEIC detection', () => {
  it('recognizes HEIC MIME and filenames without treating JPEG as HEIC', () => {
    expect(isHeicMime('image/heic')).toBe(true);
    expect(isHeicMime('image/jpeg')).toBe(false);
    expect(isHeicFileName('IMG_001.HEIC')).toBe(true);
    expect(isHeicFileName('shot.jpg')).toBe(false);
  });

  it('reads HEIC brands from the ftyp box', async () => {
    expect(await looksLikeHeic(ftypBlob('heic'))).toBe(true);
    expect(await looksLikeHeic(ftypBlob('mif1', ['heic']))).toBe(true);
    expect(await looksLikeHeic(ftypBlob('isom'))).toBe(false);
    expect(await looksLikeHeic(new Blob([new Uint8Array([0xff, 0xd8, 0xff])]))).toBe(false);
  });
});
