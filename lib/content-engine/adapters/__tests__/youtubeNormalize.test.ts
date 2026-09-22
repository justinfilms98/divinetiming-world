import { describe, it, expect } from 'vitest';
import {
  youtubeVideoUrl,
  mapPlaylistItem,
  parseChannelInput,
  isNewerThanCheckpoint,
  maxPublishedAt,
  type NormalizedVideo,
} from '@/lib/content-engine/adapters/youtubeNormalize';

describe('youtubeVideoUrl', () => {
  it('builds a canonical watch URL', () => {
    expect(youtubeVideoUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });
});

describe('mapPlaylistItem', () => {
  it('maps a full playlist item, preferring contentDetails.videoId and best thumbnail', () => {
    const mapped = mapPlaylistItem({
      snippet: {
        title: '  My Video  ',
        description: 'desc',
        publishedAt: '2024-01-01T00:00:00Z',
        resourceId: { videoId: 'aaaaaaaaaaa' },
        thumbnails: {
          default: { url: 'd.jpg' },
          high: { url: 'h.jpg' },
          maxres: { url: 'm.jpg' },
        },
      },
      contentDetails: { videoId: 'bbbbbbbbbbb', videoPublishedAt: '2024-02-02T00:00:00Z' },
    });
    expect(mapped).toEqual({
      externalId: 'bbbbbbbbbbb',
      title: 'My Video',
      description: 'desc',
      publishedAt: '2024-02-02T00:00:00Z',
      thumbnailUrl: 'm.jpg',
      sourceUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
    });
  });

  it('falls back to snippet.resourceId.videoId and Untitled', () => {
    const mapped = mapPlaylistItem({
      snippet: { resourceId: { videoId: 'ccccccccccc' }, thumbnails: {} },
    });
    expect(mapped?.externalId).toBe('ccccccccccc');
    expect(mapped?.title).toBe('Untitled');
    expect(mapped?.thumbnailUrl).toBeNull();
  });

  it('returns null when there is no video id', () => {
    expect(mapPlaylistItem({ snippet: { title: 'x' } })).toBeNull();
    expect(mapPlaylistItem(null)).toBeNull();
    expect(mapPlaylistItem(undefined)).toBeNull();
  });
});

describe('parseChannelInput', () => {
  it('accepts bare channel ids and handles', () => {
    expect(parseChannelInput('UC1234567890abcdefghijkl')).toEqual({
      channelId: 'UC1234567890abcdefghijkl',
    });
    expect(parseChannelInput('@divinetiming')).toEqual({ handle: 'divinetiming' });
  });

  it('parses channel and handle URLs', () => {
    expect(parseChannelInput('https://www.youtube.com/channel/UC1234567890abcdefghijkl')).toEqual({
      channelId: 'UC1234567890abcdefghijkl',
    });
    expect(parseChannelInput('https://youtube.com/@divinetiming')).toEqual({
      handle: 'divinetiming',
    });
  });

  it('rejects non-YouTube and malformed input', () => {
    expect(parseChannelInput('https://example.com/@x')).toBeNull();
    expect(parseChannelInput('random text')).toBeNull();
    expect(parseChannelInput('')).toBeNull();
    expect(parseChannelInput(42 as unknown)).toBeNull();
  });
});

describe('incremental checkpoint helpers', () => {
  it('keeps everything when there is no checkpoint', () => {
    expect(isNewerThanCheckpoint('2024-01-01T00:00:00Z', null)).toBe(true);
  });

  it('keeps only strictly newer items', () => {
    expect(isNewerThanCheckpoint('2024-02-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(true);
    expect(isNewerThanCheckpoint('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(false);
    expect(isNewerThanCheckpoint('2023-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(false);
  });

  it('advances the checkpoint to the newest publishedAt', () => {
    const videos: NormalizedVideo[] = [
      { externalId: 'a', title: 'a', description: '', publishedAt: '2024-01-01T00:00:00Z', thumbnailUrl: null, sourceUrl: '' },
      { externalId: 'b', title: 'b', description: '', publishedAt: '2024-03-01T00:00:00Z', thumbnailUrl: null, sourceUrl: '' },
      { externalId: 'c', title: 'c', description: '', publishedAt: null, thumbnailUrl: null, sourceUrl: '' },
    ];
    expect(maxPublishedAt(videos, null)).toBe('2024-03-01T00:00:00Z');
    expect(maxPublishedAt(videos, '2024-05-01T00:00:00Z')).toBe('2024-05-01T00:00:00Z');
    expect(maxPublishedAt([], '2024-05-01T00:00:00Z')).toBe('2024-05-01T00:00:00Z');
  });
});
