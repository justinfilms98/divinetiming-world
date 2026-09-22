-- ============================================================
-- SPRINT 3: EVENTS — TOURING HISTORY FIELDS (brief section 8)
--
-- Additive only. Expands the existing `events` table rather than replacing it:
-- every column added here is nullable or carries a default, so the 7 existing
-- rows and the current admin events editor keep working unchanged.
-- Rollback: run 043_events_touring_history.down.sql.
--
-- `ticket_url` already existed on this table (migration 001) and is reused
    10|-- as-is; it is deliberately NOT re-added here.
--
-- Closed sets, documented:
--   event_type     festival | club | private | curated | residency
--                  Nullable: existing rows predate the field and defaulting
--                  them to a type would fabricate information about real shows.
--   booking_status announced | on_sale | sold_out | cancelled
--                  NOT NULL DEFAULT 'announced' — every event that exists in
--                  the CMS is at minimum announced, so the backfill is honest.
--
    20|-- No new RLS policies. `events` already has public SELECT and the legacy
-- permissive write policies from migration 015; all admin mutations go through
-- /api/admin/events using the service role after requireAdmin(), so the anon
-- role is granted nothing further here.
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS venue_url TEXT,
    30|  ADD COLUMN IF NOT EXISTS gallery_url TEXT,
  ADD COLUMN IF NOT EXISTS recap_video_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS booking_status TEXT NOT NULL DEFAULT 'announced';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_event_type_check'
    40|  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_event_type_check
      CHECK (event_type IS NULL OR event_type IN ('festival','club','private','curated','residency'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_booking_status_check'
  ) THEN
    ALTER TABLE events
    50|      ADD CONSTRAINT events_booking_status_check
      CHECK (booking_status IN ('announced','on_sale','sold_out','cancelled'));
  END IF;
END $$;

-- The public page splits published events into upcoming and past by date, which
-- is the hottest read path on /events. (idx_events_date and idx_events_status
-- already exist separately; this composite serves the combined predicate.)
CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON events (status, date DESC);
    60|
-- Admin filtering and the "touring history" type breakdown.
CREATE INDEX IF NOT EXISTS idx_events_event_type
  ON events (event_type)
  WHERE event_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_booking_status
  ON events (booking_status);
