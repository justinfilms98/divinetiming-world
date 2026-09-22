-- Rollback for 050_label_scaffold.sql
-- Destructive: drops label scaffold tables. Export before production use.

DROP POLICY IF EXISTS "Public can read published label releases" ON label_releases;
DROP POLICY IF EXISTS "Public can read published label artists" ON label_artists;
DROP POLICY IF EXISTS "Public can read label settings" ON label_settings;

DROP INDEX IF EXISTS idx_label_releases_artist;
DROP INDEX IF EXISTS idx_label_releases_status;
DROP INDEX IF EXISTS idx_label_artists_status;

DROP TABLE IF EXISTS label_releases;
DROP TABLE IF EXISTS label_artists;
DROP TABLE IF EXISTS label_settings;
