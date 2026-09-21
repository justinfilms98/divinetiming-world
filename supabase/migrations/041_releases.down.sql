-- Rollback for 041_releases.sql
-- Destructive: discards the music catalogue. Export before running in production.

DROP POLICY IF EXISTS "Public can read published releases" ON releases;

DROP INDEX IF EXISTS idx_releases_status;
DROP INDEX IF EXISTS idx_releases_release_date;

DROP TABLE IF EXISTS releases;
