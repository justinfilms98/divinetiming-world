-- Hero 3-slot carousel (Phase 9). Backward compatible: null hero_slots = use existing single-hero fields.
-- Structure: [{ "type": "image"|"youtube", "image_storage_path": string|null, "youtube_id": string|null, "overlay_opacity": number|null }]
-- Max 3 slots enforced in application layer.

ALTER TABLE public.hero_sections
  ADD COLUMN IF NOT EXISTS hero_slots JSONB DEFAULT NULL;

COMMENT ON COLUMN public.hero_sections.hero_slots IS 'Up to 3 carousel slots. Each: type (image|youtube), image_storage_path, youtube_id, overlay_opacity (0-0.7). Null = use legacy single hero.';
