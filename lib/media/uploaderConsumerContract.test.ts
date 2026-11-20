/**
 * Shared uploader → editor contract: consumers must accept UploadedFile fields
 * produced after register (url, id, thumbnailUrl, dimensions).
 */
import { describe, expect, it } from 'vitest';

type UploadedFile = {
  url: string;
  id?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  size?: number;
};

function applyCover(setCover: (url: string, id: string | null) => void, files: UploadedFile[]) {
  if (files[0]) setCover(files[0].url, files[0].id ?? null);
}

function applyHeroSlot(
  setSlot: (url: string, id: string | null, poster: string | null) => void,
  files: UploadedFile[]
) {
  const f = files[0];
  if (!f) return;
  setSlot(f.url, f.id ?? null, f.thumbnailUrl ?? null);
}

describe('uploader consumer contract', () => {
  it('Journal cover handler uses url + id and ignores cancel/empty', () => {
    const calls: Array<[string, string | null]> = [];
    applyCover((url, id) => calls.push([url, id]), []);
    expect(calls).toEqual([]);
    applyCover((url, id) => calls.push([url, id]), [
      { url: 'https://example/media/library/1.jpg', id: 'asset-1', width: 1200, height: 800 },
    ]);
    expect(calls).toEqual([['https://example/media/library/1.jpg', 'asset-1']]);
  });

  it('Hero/video handlers can take thumbnailUrl as poster without requiring it', () => {
    const calls: Array<[string, string | null, string | null]> = [];
    applyHeroSlot((url, id, poster) => calls.push([url, id, poster]), [
      {
        url: 'https://example/media/library/2.mp4',
        id: 'asset-2',
        thumbnailUrl: 'https://example/media/library/posters/2.jpg',
        mimeType: 'video/mp4',
      },
    ]);
    expect(calls[0]).toEqual([
      'https://example/media/library/2.mp4',
      'asset-2',
      'https://example/media/library/posters/2.jpg',
    ]);
    applyHeroSlot((url, id, poster) => calls.push([url, id, poster]), [
      { url: 'https://example/media/library/3.jpg', id: 'asset-3' },
    ]);
    expect(calls[1]?.[2]).toBeNull();
  });
});
