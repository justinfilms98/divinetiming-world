-- PHASE 11: Google Drive Media Picker - External Media Assets
-- Store references to external media (Drive file IDs) instead of uploaded files

-- ============================================
-- EXTERNAL MEDIA ASSETS
-- References to media stored in Google Drive, Dropbox, etc.
-- ============================================
CREATE TABLE external_media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'dropbox')),
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

CREATE INDEX idx_external_media_provider ON external_media_assets(provider);
CREATE INDEX idx_external_media_file_id ON external_media_assets(provider, file_id);

-- RLS
ALTER TABLE external_media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read external_media" ON external_media_assets FOR SELECT USING (true);
CREATE POLICY "Admin full external_media" ON external_media_assets FOR ALL USING (true);

-- ============================================
-- ADD EXTERNAL ASSET REFERENCES
-- Optional FK - when set, resolve URL from asset; else use existing url field
-- ============================================

-- Hero sections
ALTER TABLE hero_sections ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;

-- Events (thumbnails)
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_thumbnail_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;

-- Gallery media
ALTER TABLE gallery_media ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE gallery_media ALTER COLUMN url DROP NOT NULL; -- Allow null when using external asset

-- Media carousel slides
ALTER TABLE media_carousel_slides ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;

-- Galleries (cover image)
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS external_cover_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;

-- Booking content
ALTER TABLE booking_content ADD COLUMN IF NOT EXISTS external_image_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;

-- About photos
ALTER TABLE about_photos ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE about_photos ALTER COLUMN image_url DROP NOT NULL;

-- Product images
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE product_images ALTER COLUMN image_url DROP NOT NULL;
