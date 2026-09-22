import { describe, it, expect } from 'vitest';
import {
  parseInstagramShortcode,
  instagramSourceType,
  isInstagramUrl,
} from '@/lib/content-engine/adapters/instagramNormalize';

describe('parseInstagramShortcode', () => {
  it('extracts shortcodes from post/reel/tv URLs', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/p/CxYz123_-/')).toBe('CxYz123_-');
    expect(parseInstagramShortcode('https://instagram.com/reel/ABC123/')).toBe('ABC123');
    expect(parseInstagramShortcode('https://www.instagram.com/reels/DEF456')).toBe('DEF456');
    expect(parseInstagramShortcode('https://instagram.com/tv/GHI789/')).toBe('GHI789');
  });

  it('returns null for non-instagram or malformed input', () => {
    expect(parseInstagramShortcode('https://example.com/p/abc')).toBeNull();
    expect(parseInstagramShortcode('https://youtube.com/watch?v=x')).toBeNull();
    expect(parseInstagramShortcode('not a url')).toBeNull();
    expect(parseInstagramShortcode('')).toBeNull();
    expect(parseInstagramShortcode(123 as unknown)).toBeNull();
  });
});

describe('instagramSourceType', () => {
  it('classifies reel/tv/post', () => {
    expect(instagramSourceType('https://instagram.com/reel/ABC123/')).toBe('reel');
    expect(instagramSourceType('https://instagram.com/tv/GHI789/')).toBe('video');
    expect(instagramSourceType('https://instagram.com/p/CxYz123/')).toBe('post');
  });

  it('returns null for non-instagram URLs', () => {
    expect(instagramSourceType('https://example.com')).toBeNull();
  });
});

describe('isInstagramUrl', () => {
  it('detects identifiable instagram content URLs', () => {
    expect(isInstagramUrl('https://instagram.com/p/abc')).toBe(true);
    expect(isInstagramUrl('https://instagram.com/someprofile')).toBe(false);
    expect(isInstagramUrl('https://example.com')).toBe(false);
  });
});
