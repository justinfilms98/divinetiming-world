-- Run this entire block in Supabase SQL Editor. Do not add any text above the first line.
-- Storage policies for bucket "media" must be created in Dashboard (Storage → media → Policies).

ALTER TABLE public.hero_sections
  ADD COLUMN IF NOT EXISTS media_storage_path TEXT;

ALTER TABLE public.hero_sections
  ADD COLUMN IF NOT EXISTS hero_logo_storage_path TEXT;

CREATE INDEX IF NOT EXISTS hero_sections_page_slug_idx
ON public.hero_sections(page_slug);
