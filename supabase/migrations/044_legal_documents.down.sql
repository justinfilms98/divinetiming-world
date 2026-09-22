-- Rollback for 044_legal_documents.sql
--
-- Destructive: drops the publication state and effective dates recorded since
-- the migration ran. Export legal_policies before running in production.
--
-- Does NOT restore the 036 seed bodies. Those contained fabricated commitments
-- (an invented return window and invented delivery estimates) and are not worth
-- resurrecting; restore reviewed copy from a backup instead.
--
-- WARNING: this restores the 036 security posture, which grants the anon role
-- full write access to legal_policies and exposes unpublished drafts publicly.
-- Only roll back if you are also reverting the application code.

DROP POLICY IF EXISTS "Public can read published legal_policies" ON legal_policies;

CREATE POLICY "Public read legal_policies" ON legal_policies
  FOR SELECT USING (true);

CREATE POLICY "Admin full legal_policies" ON legal_policies
  FOR ALL USING (true) WITH CHECK (true);

DROP INDEX IF EXISTS idx_legal_policies_status;

ALTER TABLE legal_policies
  DROP CONSTRAINT IF EXISTS legal_policies_status_check;

ALTER TABLE legal_policies
  ALTER COLUMN updated_at DROP NOT NULL;

ALTER TABLE legal_policies
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS effective_date,
  DROP COLUMN IF EXISTS status;
