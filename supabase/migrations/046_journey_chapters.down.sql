-- Rollback for 046_journey_chapters.sql
-- Drops the additive chapter columns and restores the 037 policies.

DROP POLICY IF EXISTS "Public can read published journey_blocks" ON journey_blocks;

DROP INDEX IF EXISTS idx_journey_blocks_status;

ALTER TABLE journey_blocks DROP CONSTRAINT IF EXISTS journey_blocks_status_check;
ALTER TABLE journey_blocks DROP COLUMN IF EXISTS status;
ALTER TABLE journey_blocks DROP COLUMN IF EXISTS era_label;

DROP POLICY IF EXISTS "Public read journey_blocks" ON journey_blocks;
CREATE POLICY "Public read journey_blocks" ON journey_blocks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full journey_blocks" ON journey_blocks;
CREATE POLICY "Admin full journey_blocks" ON journey_blocks
  FOR ALL USING (true) WITH CHECK (true);
