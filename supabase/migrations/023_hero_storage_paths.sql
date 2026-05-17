-- Hero media migration: Supabase Storage paths (backwards compatible with existing URL columns)
-- Bucket: public-media. Store paths only; public URL = ${SUPABASE_URL}/storage/v1/object/public/public-media/${path}

ALTER TABLE public.hero_sections ADD COLUMN IF NOT EXISTS media_storage_path TEXT;
ALTER TABLE public.hero_sections ADD COLUMN IF NOT EXISTS hero_logo_storage_path TEXT;

-- No columns removed; media_url and hero_logo_url remain for fallback.
