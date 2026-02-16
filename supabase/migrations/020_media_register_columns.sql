-- Phase: Media register + thumbnails (idempotent)
-- Ensures external_media_assets has required columns for register API; events/products thumbnail columns.

-- 1) external_media_assets: add columns only if missing (schema may already have file_id, preview_url, etc.)
ALTER TABLE IF EXISTS public.external_media_assets ADD COLUMN IF NOT EXISTS provider_id text;
ALTER TABLE IF EXISTS public.external_media_assets ADD COLUMN IF NOT EXISTS uuid text;
ALTER TABLE IF EXISTS public.external_media_assets ADD COLUMN IF NOT EXISTS cdn_url text;
ALTER TABLE IF EXISTS public.external_media_assets ADD COLUMN IF NOT EXISTS width int;
ALTER TABLE IF EXISTS public.external_media_assets ADD COLUMN IF NOT EXISTS height int;

-- Uniqueness for upsert: (provider, file_id) or (provider, provider_id) or uuid
CREATE UNIQUE INDEX IF NOT EXISTS external_media_assets_provider_file_id_unique
  ON public.external_media_assets (provider, file_id)
  WHERE provider IS NOT NULL AND file_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS external_media_assets_uuid_unique
  ON public.external_media_assets (uuid)
  WHERE uuid IS NOT NULL;

-- 2) events: thumbnail columns (if not already present from 014)
ALTER TABLE IF EXISTS public.events
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_asset_uuid text;

-- 3) products: thumbnail columns (if not already present)
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_asset_uuid text;
