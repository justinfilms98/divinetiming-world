import { describe, it, expect } from 'vitest';
import { classifyManualUrl } from '@/lib/content-engine/classify';

describe('classifyManualUrl', () => {
  it('classifies YouTube URLs with the video id as the identity', () => {
    expect(classifyManualUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      externalId: 'dQw4w9WgXcQ',
      sourceType: 'video',
      draftType: 'video',
    });
  });

  it('classifies Instagram URLs with the shortcode as the identity', () => {
    expect(classifyManualUrl('https://instagram.com/reel/ABC123/')).toEqual({
      provider: 'instagram',
      externalId: 'ABC123',
      sourceType: 'reel',
      draftType: 'media',
    });
    expect(classifyManualUrl('https://instagram.com/p/XYZ789/')).toEqual({
      provider: 'instagram',
      externalId: 'XYZ789',
      sourceType: 'post',
      draftType: 'media',
    });
  });

  it('falls back to generic manual for other URLs (no stable identity)', () => {
    const c = classifyManualUrl('https://example.com/some-article');
    expect(c.provider).toBe('manual');
    expect(c.externalId).toBeNull();
    expect(c.sourceType).toBe('link');
  });

  it('handles title-only entries (no URL)', () => {
    expect(classifyManualUrl(null)).toEqual({
      provider: 'manual',
      externalId: null,
      sourceType: 'unknown',
      draftType: 'unknown',
    });
  });
});
