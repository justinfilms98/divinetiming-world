import { describe, expect, it } from 'vitest';
import { createFakeDb, fakeSupabase } from '@/test/fakeSupabase';
import { findReferencedMediaPaths } from './mediaReferenceGuard';

describe('findReferencedMediaPaths', () => {
  it('detects library file_id and poster thumbnail URLs', async () => {
    const db = createFakeDb({
      external_media_assets: [
        {
          file_id: 'library/1795100000000-owner.jpg',
          preview_url: 'https://x.supabase.co/storage/v1/object/public/media/library/1795100000000-owner.jpg',
          thumbnail_url: null,
          cdn_url: null,
        },
        {
          file_id: 'library/1795100000001-video.mp4',
          preview_url: 'https://x.supabase.co/storage/v1/object/public/media/library/1795100000001-video.mp4',
          thumbnail_url:
            'https://x.supabase.co/storage/v1/object/public/media/library/posters/1795100000002-poster.jpg',
          cdn_url: null,
        },
      ],
      hero_sections: [],
      journal_episodes: [],
      events: [],
      event_media: [],
      galleries: [],
      gallery_media: [],
      journey_blocks: [],
      product_images: [],
      products: [],
      releases: [],
      about_photos: [],
      media_carousel_slides: [],
      site_settings: [],
      booking_content: [],
      page_settings: [],
      photos: [],
      photo_albums: [],
      presskit_assets: [],
      videos: [],
    });
    const supabase = fakeSupabase(db);
    const hit = await findReferencedMediaPaths(supabase, [
      'library/1795100000000-owner.jpg',
      'library/posters/1795100000002-poster.jpg',
      'library/1795999999999-orphan.jpg',
    ]);
    expect(hit.has('library/1795100000000-owner.jpg')).toBe(true);
    expect(hit.has('library/posters/1795100000002-poster.jpg')).toBe(true);
    expect(hit.has('library/1795999999999-orphan.jpg')).toBe(false);
  });

  it('detects hero storage paths and journal cover URLs', async () => {
    const path = 'library/1795200000100-hero.mp4';
    const cover = 'library/1795200000101-cover.jpg';
    const db = createFakeDb({
      external_media_assets: [],
      hero_sections: [{ media_storage_path: path, hero_logo_storage_path: null, media_url: null, hero_logo_url: null }],
      journal_episodes: [
        {
          cover_image_url: `https://x.supabase.co/storage/v1/object/public/media/${cover}`,
        },
      ],
      events: [],
      event_media: [],
      galleries: [],
      gallery_media: [],
      journey_blocks: [],
      product_images: [],
      products: [],
      releases: [],
      about_photos: [],
      media_carousel_slides: [],
      site_settings: [],
      booking_content: [],
      page_settings: [],
      photos: [],
      photo_albums: [],
      presskit_assets: [],
      videos: [],
    });
    const hit = await findReferencedMediaPaths(fakeSupabase(db), [path, cover, 'library/1795200000999-free.jpg']);
    expect(hit.has(path)).toBe(true);
    expect(hit.has(cover)).toBe(true);
    expect(hit.has('library/1795200000999-free.jpg')).toBe(false);
  });
});
