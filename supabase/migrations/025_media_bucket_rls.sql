-- Standardize on bucket "media" for hero (and other admin uploads).
-- Assumes bucket "media" already exists and is PUBLIC.
--
-- NOTE: RLS policies on storage.objects cannot be created from the SQL Editor
-- (role is not owner of storage.objects). Create them in the Dashboard instead:
--   Storage → select bucket "media" → Policies → New policy (or use the definitions below).

-- 1) Ensure hero_sections has storage-path columns (non-breaking)
ALTER TABLE public.hero_sections
  ADD COLUMN IF NOT EXISTS media_storage_path TEXT;

ALTER TABLE public.hero_sections
  ADD COLUMN IF NOT EXISTS hero_logo_storage_path TEXT;

-- 2) Index for faster hero lookups by page_slug
CREATE INDEX IF NOT EXISTS hero_sections_page_slug_idx
ON public.hero_sections(page_slug);
