-- Phase 17.B: Add 'supabase' provider for external_media_assets (Uploadcare removed from new uploads)
ALTER TABLE external_media_assets DROP CONSTRAINT IF EXISTS external_media_assets_provider_check;
ALTER TABLE external_media_assets ADD CONSTRAINT external_media_assets_provider_check
  CHECK (provider IN ('google_drive', 'dropbox', 'uploadcare', 'supabase'));
