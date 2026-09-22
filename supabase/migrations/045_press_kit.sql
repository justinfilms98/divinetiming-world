-- ============================================================
-- SPRINT 3: PRESS KIT (brief section 10)
--
-- Extends the existing singleton `presskit` table (migration 001) with the
-- fields the brief requires, plus three small child tables for assets,
-- press releases, and notable performances.
--
-- Additive and idempotent. Does not invent artist copy or a PDF binary.
-- Existing bio_text / experience_text / pdf_url stay in place; new columns
-- are nullable so the current row keeps working.
--
-- Security: 001 granted `FOR ALL USING (true)` to PUBLIC, which let the anon
-- role write the press kit. This migration drops that write policy. Public
-- SELECT stays (the kit is public by nature). Mutations go through
-- /api/admin/presskit* after requireAdmin() + service role, matching
-- 041_releases / 044_legal_documents.
--
-- Rollback: run 045_press_kit.down.sql.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Singleton columns
-- ------------------------------------------------------------

ALTER TABLE presskit ADD COLUMN IF NOT EXISTS short_bio TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS long_bio TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS hospitality_rider_text TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS tech_rider_url TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS hospitality_rider_url TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS performance_reel_url TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS booking_contact_name TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS booking_contact_email TEXT;
ALTER TABLE presskit ADD COLUMN IF NOT EXISTS booking_contact_phone TEXT;

-- Existing bio_text is the long bio until the artist splits it.
UPDATE presskit
SET long_bio = bio_text
WHERE long_bio IS NULL AND bio_text IS NOT NULL AND btrim(bio_text) <> '';

-- ------------------------------------------------------------
-- 2. High-res photos and logos (picked from the media library)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS presskit_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL DEFAULT 'photo'
    CHECK (kind IN ('photo','logo')),
  external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL,
  url TEXT,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presskit_assets_kind_order
  ON presskit_assets (kind, display_order);

-- ------------------------------------------------------------
-- 3. Press releases
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS press_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body_md TEXT,
  published_at DATE,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_press_releases_status
  ON press_releases (status);

-- ------------------------------------------------------------
-- 4. Notable performances (editable; events are too sparse / test-y)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS presskit_performances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  venue TEXT,
  city TEXT,
  country TEXT,
  year INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presskit_performances_order
  ON presskit_performances (display_order, year DESC NULLS LAST);

-- ------------------------------------------------------------
-- 5. Row level security
-- ------------------------------------------------------------

ALTER TABLE presskit ENABLE ROW LEVEL SECURITY;
ALTER TABLE presskit_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE presskit_performances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON presskit;

DROP POLICY IF EXISTS "Public read access" ON presskit;
CREATE POLICY "Public read access" ON presskit
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read presskit_assets" ON presskit_assets;
CREATE POLICY "Public can read presskit_assets" ON presskit_assets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read published press_releases" ON press_releases;
CREATE POLICY "Public can read published press_releases" ON press_releases
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public can read presskit_performances" ON presskit_performances;
CREATE POLICY "Public can read presskit_performances" ON presskit_performances
  FOR SELECT USING (true);
