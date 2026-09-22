-- ============================================================
-- SPRINT 3: COLLECTIONS AS CURATED VISUAL STORIES (brief §13)
--
-- Extends existing galleries (009 + 031) into publishable visual
-- stories: a featured flag and optional theme/chapter label.
-- Does not replace the table, invent stories, or seed copy.
--
-- Story title = name. Editorial intro = description.
-- Cover, publish status, and display_order already exist.
--
-- Rollback: run 049_collection_stories.down.sql.
-- ============================================================

ALTER TABLE galleries
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE galleries
  ADD COLUMN IF NOT EXISTS theme TEXT;

CREATE INDEX IF NOT EXISTS idx_galleries_public_story
  ON galleries (is_featured DESC, display_order)
  WHERE status = 'published';

COMMENT ON COLUMN galleries.is_featured IS 'Featured stories lead the public Collections hub.';
COMMENT ON COLUMN galleries.theme IS 'Optional chapter/theme label. Artist-authored; not seeded.';
