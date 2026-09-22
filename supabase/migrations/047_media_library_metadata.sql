-- ============================================================
-- SPRINT 3: MEDIA LIBRARY METADATA (brief section 12)
--
-- Extends the existing `external_media_assets` row (the CMS asset source)
-- with tags, category, alt text, photographer, location, captured date,
-- orientation, featured, usage type, and archive state.
--
-- Additive and idempotent. No parallel media table. Existing rows stay
-- visible: usage_type defaults to 'public', is_archived to false.
--
-- Security: 013/014 granted public SELECT USING (true) and 015 granted
-- writes USING (true) to every role, including anon. This tightens anon
-- reads to non-archived, non-internal assets. Authenticated SELECT/write
-- stays so admin pickers and the Google Drive register path keep working.
-- Mutations from the admin UI go through /api/admin/media-library after
-- requireAdmin() + service role.
--
-- Rollback: run 047_media_library_metadata.down.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columns
-- ------------------------------------------------------------

ALTER TABLE public.external_media_assets
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS photographer TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS captured_at DATE,
  ADD COLUMN IF NOT EXISTS orientation TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_type TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'external_media_assets_orientation_check'
  ) THEN
    ALTER TABLE public.external_media_assets
      ADD CONSTRAINT external_media_assets_orientation_check
      CHECK (orientation IS NULL OR orientation IN ('landscape', 'portrait', 'square', 'unknown'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'external_media_assets_usage_type_check'
  ) THEN
    ALTER TABLE public.external_media_assets
      ADD CONSTRAINT external_media_assets_usage_type_check
      CHECK (usage_type IN ('internal', 'public', 'gallery', 'hero', 'press', 'product'));
  END IF;
END $$;

COMMENT ON COLUMN public.external_media_assets.alt_text IS 'Accessible description. Required before featuring.';
COMMENT ON COLUMN public.external_media_assets.photographer IS 'Credit / photographer name.';
COMMENT ON COLUMN public.external_media_assets.location IS 'Where the asset was captured.';
COMMENT ON COLUMN public.external_media_assets.captured_at IS 'Capture date (not upload time).';
COMMENT ON COLUMN public.external_media_assets.orientation IS 'landscape | portrait | square | unknown';
COMMENT ON COLUMN public.external_media_assets.is_featured IS 'Editorial highlight in admin / public surfaces.';
COMMENT ON COLUMN public.external_media_assets.usage_type IS 'internal (CMS only) or a public surface: public, gallery, hero, press, product.';
COMMENT ON COLUMN public.external_media_assets.is_archived IS 'Hidden from public surfaces and default picker lists.';
COMMENT ON COLUMN public.external_media_assets.category IS 'Single free-text category (Live, Studio, Press, …).';
COMMENT ON COLUMN public.external_media_assets.tags IS 'Free-text tags for filtering.';

-- Backfill orientation from stored pixel size when we have it.
UPDATE public.external_media_assets
SET orientation = CASE
  WHEN width IS NULL OR height IS NULL OR width <= 0 OR height <= 0 THEN 'unknown'
  WHEN width > height THEN 'landscape'
  WHEN height > width THEN 'portrait'
  ELSE 'square'
END
WHERE orientation IS NULL;

-- ------------------------------------------------------------
-- 2. Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_external_media_tags
  ON public.external_media_assets USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_external_media_category
  ON public.external_media_assets (category);

CREATE INDEX IF NOT EXISTS idx_external_media_archived
  ON public.external_media_assets (is_archived);

CREATE INDEX IF NOT EXISTS idx_external_media_usage_type
  ON public.external_media_assets (usage_type);

CREATE INDEX IF NOT EXISTS idx_external_media_featured
  ON public.external_media_assets (is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_external_media_public_list
  ON public.external_media_assets (usage_type, created_at DESC)
  WHERE is_archived = false;

-- ------------------------------------------------------------
-- 3. RLS — public reads only what should be public
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Public read external_media" ON public.external_media_assets;
DROP POLICY IF EXISTS "Admin full external_media" ON public.external_media_assets;
DROP POLICY IF EXISTS "Auth delete media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Auth insert media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Auth select media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Auth users can delete media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Auth users can insert media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Auth users can read media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Anon read public media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Authenticated read all media assets" ON public.external_media_assets;
DROP POLICY IF EXISTS "Authenticated write media assets" ON public.external_media_assets;

ALTER TABLE public.external_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read public media assets"
  ON public.external_media_assets
  FOR SELECT
  TO anon
  USING (is_archived = false AND usage_type <> 'internal');

CREATE POLICY "Authenticated read all media assets"
  ON public.external_media_assets
  FOR SELECT
  TO authenticated
  USING (true);

-- App-level admin gate; keeps Drive register + any authenticated CMS writes working.
CREATE POLICY "Authenticated write media assets"
  ON public.external_media_assets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
