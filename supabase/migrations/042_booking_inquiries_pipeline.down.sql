-- Rollback for 042_booking_inquiries_pipeline.sql
-- Destructive: drops the qualifying fields and pipeline state captured on
-- inquiries since the migration ran. Export before running in production.

DROP INDEX IF EXISTS idx_booking_inquiries_created_at;
DROP INDEX IF EXISTS idx_booking_inquiries_status;

ALTER TABLE booking_inquiries
  DROP CONSTRAINT IF EXISTS booking_inquiries_status_check;

ALTER TABLE booking_inquiries
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS next_action,
  DROP COLUMN IF EXISTS how_heard,
  DROP COLUMN IF EXISTS estimated_attendance,
  DROP COLUMN IF EXISTS venue,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS event_name,
  DROP COLUMN IF EXISTS phone;
