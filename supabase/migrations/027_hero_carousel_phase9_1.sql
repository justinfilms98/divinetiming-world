-- Phase 9.1: Hero 3-slot carousel schema documentation and legacy cleanup readiness.
-- hero_slots column already added in 026_hero_carousel. This migration updates the
-- column comment to the new slot shape and ensures legacy URL columns can be nulled
-- when purging Uploadcare (no columns dropped).

-- Document the new hero_slots JSONB shape (3 slots, image | video | embed)
COMMENT ON COLUMN public.hero_sections.hero_slots IS 'Up to 3 carousel slots. Each slot: slot_index (1|2|3), enabled (bool), media_type (image|video|embed), image_storage_path, video_storage_path, poster_storage_path, embed_provider (youtube|vimeo), embed_id, embed_url, overlay_opacity (0-70). Null/empty = use legacy single-hero fields (media_url, media_storage_path, etc.).';

-- Legacy columns (media_url, hero_logo_url, etc.) already allow NULL; no schema change
-- required for purge. Application will set them to null via API when user confirms purge.
