-- ============================================================
-- SPRINT 3: JOURNEY CHAPTERS (brief section 11)
--
-- Extends existing journey_blocks (037) into publishable cinematic
-- chapters: an era/date label plus draft/published status. Does not
-- replace the table, invent biography, or seed chapter copy.
--
-- Existing rows are instructional placeholders ("Replace this
-- placeholder…", "New block") so they default to draft and stay off
-- the public page until an editor publishes real copy.
--
-- SECURITY: 037 granted PUBLIC SELECT on every row and FOR ALL writes.
-- Public SELECT is now published-only. Writes go through
-- /api/admin/journey-blocks after requireAdmin() + service role,
-- matching 041_releases / 044_legal_documents / 045_press_kit.
--
-- Rollback: run 046_journey_chapters.down.sql.
-- ============================================================

ALTER TABLE journey_blocks
  ADD COLUMN IF NOT EXISTS era_label TEXT;

ALTER TABLE journey_blocks
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journey_blocks_status_check'
  ) THEN
    ALTER TABLE journey_blocks
      ADD CONSTRAINT journey_blocks_status_check
      CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_journey_blocks_status
  ON journey_blocks (status);

ALTER TABLE journey_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read journey_blocks" ON journey_blocks;
DROP POLICY IF EXISTS "Admin full journey_blocks" ON journey_blocks;
DROP POLICY IF EXISTS "Public can read published journey_blocks" ON journey_blocks;

CREATE POLICY "Public can read published journey_blocks" ON journey_blocks
  FOR SELECT USING (status = 'published');
