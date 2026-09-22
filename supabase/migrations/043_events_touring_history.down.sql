-- ============================================================
-- Rollback for 043_events_touring_history.sql
--
-- Drops only what 043 added. `ticket_url`, `status`, `idx_events_date` and
-- `idx_events_status` predate 043 and are left intact.
-- ============================================================

DROP INDEX IF EXISTS idx_events_booking_status;
DROP INDEX IF EXISTS idx_events_event_type;
    10|DROP INDEX IF EXISTS idx_events_status_date;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_booking_status_check;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE events
  DROP COLUMN IF EXISTS booking_status,
  DROP COLUMN IF EXISTS recap_video_url,
  DROP COLUMN IF EXISTS gallery_url,
  DROP COLUMN IF EXISTS venue_url,
    20|  DROP COLUMN IF EXISTS event_type,
  DROP COLUMN IF EXISTS country;
