-- Rollback for 049_collection_stories.sql

DROP INDEX IF EXISTS idx_galleries_public_story;

ALTER TABLE galleries DROP COLUMN IF EXISTS is_featured;
ALTER TABLE galleries DROP COLUMN IF EXISTS theme;
