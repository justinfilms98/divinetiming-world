-- ============================================================
-- SPRINT 1: SUBSCRIBERS (Tribe email capture)
--
-- Additive only. No changes to existing tables or data.
-- Rollback: run 040_subscribers.down.sql (drops this table only).
--
-- Security model mirrors booking_inquiries: the public signup form must be
-- able to INSERT anonymously, but only authenticated admins may read the
-- list. There is deliberately no UPDATE/DELETE policy — list maintenance
-- goes through service-role admin routes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  first_name TEXT,
  city TEXT,
  country TEXT,
  -- Where the signup came from, so campaigns can be attributed later.
  source TEXT NOT NULL DEFAULT 'homepage',
  -- Audience segment per brief section 17. Defaults to 'fan'; other segments
  -- are assigned by admins rather than self-selected at signup.
  segment TEXT NOT NULL DEFAULT 'fan'
    CHECK (segment IN ('fan','attendee','buyer','press','booker','artist')),
  status TEXT NOT NULL DEFAULT 'subscribed'
    CHECK (status IN ('subscribed','unsubscribed','bounced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness: re-submitting the same address is an upsert,
-- not a duplicate row.
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscribers_email
  ON subscribers (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_subscribers_created_at
  ON subscribers (created_at DESC);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read subscribers" ON subscribers;
CREATE POLICY "Authenticated can read subscribers" ON subscribers
  FOR SELECT USING (auth.role() = 'authenticated');
