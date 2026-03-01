-- PHASE 13: Booking About section + Event slug for detail page

-- ============================================
-- PAGE_SETTINGS: Booking About fields
-- Used when page_slug = 'booking'
-- ============================================
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS booking_about_title TEXT;
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS booking_about_body TEXT;
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS booking_about_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL;
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS booking_about_image_url TEXT;

-- ============================================
-- EVENTS: Add slug for detail page URLs
-- ============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Backfill slugs from title + date for existing events
UPDATE events SET slug = (
  LOWER(REGEXP_REPLACE(COALESCE(TRIM(title), city, 'event'), '[^a-zA-Z0-9]+', '-', 'g'))
  || '-'
  || TO_CHAR(date AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  || '-'
  || SUBSTRING(id::text, 1, 8)
)
WHERE slug IS NULL;

-- Ensure no empty slugs
UPDATE events SET slug = 'event-' || SUBSTRING(id::text, 1, 8) WHERE slug = '' OR slug IS NULL;
