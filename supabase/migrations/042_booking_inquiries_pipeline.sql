-- ============================================================
-- SPRINT 3: BOOKING INQUIRY PIPELINE
--
-- Additive only: every column is nullable or has a default, so existing rows
-- and the current /api/booking payload keep working unchanged.
-- Rollback: run 042_booking_inquiries_pipeline.down.sql.
--
-- Adds the qualifying fields from brief section 9.3 and the six-state status
-- pipeline from the admin inquiry card. `location` is kept as-is for existing
-- rows; new submissions populate the finer-grained city/country instead.
--
-- No new RLS policies. The table already allows public INSERT (the form) and
-- authenticated SELECT. Status updates go through /api/admin/booking-inquiries
-- using the service role, so no UPDATE policy is granted to the anon role.
-- ============================================================

ALTER TABLE booking_inquiries
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS event_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS estimated_attendance INTEGER,
  ADD COLUMN IF NOT EXISTS how_heard TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Existing rows predate the pipeline, so they default to 'new'.
ALTER TABLE booking_inquiries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_inquiries_status_check'
  ) THEN
    ALTER TABLE booking_inquiries
      ADD CONSTRAINT booking_inquiries_status_check
      CHECK (status IN ('new','contacted','negotiating','confirmed','declined','archived'));
  END IF;
END $$;

-- The admin list sorts newest-first and filters by status.
CREATE INDEX IF NOT EXISTS idx_booking_inquiries_status
  ON booking_inquiries (status);

CREATE INDEX IF NOT EXISTS idx_booking_inquiries_created_at
  ON booking_inquiries (created_at DESC);
