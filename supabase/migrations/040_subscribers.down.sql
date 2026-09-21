-- Rollback for 040_subscribers.sql
-- Drops the subscribers table and its policies/indexes. Destructive: this
-- discards captured email signups. Export before running in production.

DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
DROP POLICY IF EXISTS "Authenticated can read subscribers" ON subscribers;

DROP INDEX IF EXISTS idx_subscribers_created_at;
DROP INDEX IF EXISTS uq_subscribers_email;

DROP TABLE IF EXISTS subscribers;
