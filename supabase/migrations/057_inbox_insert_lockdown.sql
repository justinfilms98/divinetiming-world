-- ============================================================
-- Remove anonymous INSERT on inbox tables. Anyone with the anon key
-- could insert rows directly via REST, skipping validation, the
-- honeypot and the per-email throttle, and could set columns such as
-- subscribers.status. /api/subscribe, /api/booking and
-- /api/analytics/track now write with the service role.
--
-- APPLY ONLY AFTER the code from branch fix/rls-lockdown is deployed;
-- applying earlier breaks the live signup and booking forms.
-- Rollback: 057_inbox_insert_lockdown.down.sql
-- ============================================================

DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
DROP POLICY IF EXISTS "Public insert booking_inquiries" ON booking_inquiries;
DROP POLICY IF EXISTS "Service role insert analytics" ON analytics_events;
