-- Rollback for 047_media_library_metadata.sql
-- Restores the 014/015 public-read + open-write policies.

DROP POLICY IF EXISTS "Anon read public media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Authenticated read all media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Authenticated write media assets" ON public.external_media_assets;

DROP POLICY IF EXISTS "Public read external_media" ON public.external_media_assets;
CREATE POLICY "Public read external_media"
  ON public.external_media_assets
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin full external_media" ON public.external_media_assets;
CREATE POLICY "Admin full external_media"
  ON public.external_media_assets
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP INDEX IF EXISTS idx_external_media_public_list;
DROP INDEX IF EXISTS idx_external_media_featured;
DROP INDEX IF EXISTS idx_external_media_usage_type;
DROP INDEX IF EXISTS idx_external_media_archived;
DROP INDEX IF EXISTS idx_external_media_category;
DROP INDEX IF EXISTS idx_external_media_tags;

ALTER TABLE public.external_media_assets
  DROP CONSTRAINT IF EXISTS external_media_assets_orientation_check;

ALTER TABLE public.external_media_assets
  DROP CONSTRAINT IF EXISTS external_media_assets_usage_type_check;

ALTER TABLE public.external_media_assets
  DROP COLUMN IF EXISTS alt_text,
  DROP COLUMN IF EXISTS photographer,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS captured_at,
  DROP COLUMN IF EXISTS orientation,
  DROP COLUMN IF EXISTS is_featured,
  DROP COLUMN IF EXISTS usage_type,
  DROP COLUMN IF EXISTS is_archived,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS tags;
