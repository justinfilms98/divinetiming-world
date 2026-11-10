import type { HeroSlot } from '@/lib/types/content';

const LIB = 'https://example.supabase.co/storage/v1/object/public/media/library';

/** Shape of the live home hero_slots on 2026-11-10: one image, two switched-off videos still linked. */
export const LIVE_HOME_SLOTS: HeroSlot[] = [
  { slot_index: 1, enabled: true, media_type: 'image', image_url: `${LIB}/1794269804419-image.jpg`, video_url: null, image_storage_path: null, video_storage_path: null, poster_storage_path: null, embed_provider: null, embed_id: null, embed_url: null, overlay_opacity: 0 },
  { slot_index: 2, enabled: false, media_type: 'video', image_url: null, video_url: `${LIB}/1779482521222-hero_2.mp4`, image_storage_path: null, video_storage_path: null, poster_storage_path: null, embed_provider: null, embed_id: null, embed_url: null, overlay_opacity: 0 },
  { slot_index: 3, enabled: false, media_type: 'video', image_url: null, video_url: `${LIB}/1779482501628-hero_3.mp4`, image_storage_path: null, video_storage_path: null, poster_storage_path: null, embed_provider: null, embed_id: null, embed_url: null, overlay_opacity: 0 },
];
