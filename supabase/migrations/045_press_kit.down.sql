-- Rollback for 045_press_kit.sql
-- Drops the child tables and the additive presskit columns. Does not touch
-- bio_text, experience_text, or pdf_url.

DROP POLICY IF EXISTS "Public can read presskit_performances" ON presskit_performances;
DROP POLICY IF EXISTS "Public can read published press_releases" ON press_releases;
DROP POLICY IF EXISTS "Public can read presskit_assets" ON presskit_assets;

DROP INDEX IF EXISTS idx_presskit_performances_order;
DROP INDEX IF EXISTS idx_press_releases_status;
DROP INDEX IF EXISTS idx_presskit_assets_kind_order;

DROP TABLE IF EXISTS presskit_performances;
DROP TABLE IF EXISTS press_releases;
DROP TABLE IF EXISTS presskit_assets;

ALTER TABLE presskit DROP COLUMN IF EXISTS short_bio;
ALTER TABLE presskit DROP COLUMN IF EXISTS long_bio;
ALTER TABLE presskit DROP COLUMN IF EXISTS hospitality_rider_text;
ALTER TABLE presskit DROP COLUMN IF EXISTS tech_rider_url;
ALTER TABLE presskit DROP COLUMN IF EXISTS hospitality_rider_url;
ALTER TABLE presskit DROP COLUMN IF EXISTS performance_reel_url;
ALTER TABLE presskit DROP COLUMN IF EXISTS booking_contact_name;
ALTER TABLE presskit DROP COLUMN IF EXISTS booking_contact_email;
ALTER TABLE presskit DROP COLUMN IF EXISTS booking_contact_phone;

-- Restore the 001 write policy only if rolling back before a later security fix.
DROP POLICY IF EXISTS "Admin full access" ON presskit;
CREATE POLICY "Admin full access" ON presskit FOR ALL USING (true);
