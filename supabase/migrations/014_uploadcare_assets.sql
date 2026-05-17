-- PHASE 12: Uploadcare - Add uploadcare provider to external_media_assets
-- Creates table if missing (from 013), then adds uploadcare to provider constraint

-- Create table if it doesn't exist (covers case where 013 was never run)
CREATE TABLE IF NOT EXISTS external_media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'dropbox', 'uploadcare')),
  file_id TEXT NOT NULL,
  name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  thumbnail_url TEXT,
  preview_url TEXT,
  web_view_link TEXT,
  source_folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_media_provider ON external_media_assets(provider);
CREATE INDEX IF NOT EXISTS idx_external_media_file_id ON external_media_assets(provider, file_id);

ALTER TABLE external_media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read external_media" ON external_media_assets;
CREATE POLICY "Public read external_media" ON external_media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full external_media" ON external_media_assets;
CREATE POLICY "Admin full external_media" ON external_media_assets FOR ALL USING (true);

-- Add FK columns to related tables (idempotent)
ALTER TABLE hero_sections ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_thumbnail_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE media_carousel_slides ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS external_cover_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE booking_content ADD COLUMN IF NOT EXISTS external_image_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE about_photos ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;

-- Update provider constraint if table already existed from 013 (with old constraint)
ALTER TABLE external_media_assets DROP CONSTRAINT IF EXISTS external_media_assets_provider_check;
ALTER TABLE external_media_assets ADD CONSTRAINT external_media_assets_provider_check
  CHECK (provider IN ('google_drive', 'dropbox', 'uploadcare'));
