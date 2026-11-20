import { describe, expect, it } from 'vitest';
import { isStillPosterUrl } from '@/lib/media/videoPoster';

describe('isStillPosterUrl', () => {
  it('accepts image URLs and rejects video URLs', () => {
    expect(isStillPosterUrl('https://x.supabase.co/storage/v1/object/public/media/library/posters/a.jpg')).toBe(true);
    expect(isStillPosterUrl('https://x.supabase.co/storage/v1/object/public/media/library/a.webp')).toBe(true);
    expect(isStillPosterUrl('https://x.supabase.co/storage/v1/object/public/media/library/a.mp4')).toBe(false);
    expect(isStillPosterUrl('https://x.supabase.co/storage/v1/object/public/media/library/a.mov?x=1')).toBe(false);
    expect(isStillPosterUrl(null)).toBe(false);
  });
});
