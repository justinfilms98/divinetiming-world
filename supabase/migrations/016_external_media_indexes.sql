-- PHASE 12: Indexes for external_media_assets (Library filters, sorting)
CREATE INDEX IF NOT EXISTS idx_external_media_created_at ON external_media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_media_mime_type ON external_media_assets(mime_type);
