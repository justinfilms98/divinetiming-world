-- ============================================================
-- SPRINT 3 §16: RECORD LABEL SCAFFOLD
--
-- Architecture only. Public presence stays off until the label is
-- operational. Later (not this migration): roster CRUD, release pages,
-- artist submissions, and a real public catalogue. No seed artists or
-- invented releases.
--
-- Additive. Rollback: 050_label_scaffold.down.sql.
--
-- Security: RLS on, no write policies (admin mutations later via
-- service role after requireAdmin()). Public SELECT only when the row
-- is published AND label_settings.public_enabled. The site feature flag
-- NEXT_PUBLIC_LABEL_PUBLIC_ENABLED (default off) separately 404s /label.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Singleton gate for catalogue visibility. Default off.
CREATE TABLE IF NOT EXISTS label_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS label_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS label_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES label_artists(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  release_date DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_label_artists_status ON label_artists (status);
CREATE INDEX IF NOT EXISTS idx_label_releases_status ON label_releases (status);
CREATE INDEX IF NOT EXISTS idx_label_releases_artist ON label_releases (artist_id);

ALTER TABLE label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_releases ENABLE ROW LEVEL SECURITY;

-- Needed so the catalogue policies can see the gate row as anon.
DROP POLICY IF EXISTS "Public can read label settings" ON label_settings;
CREATE POLICY "Public can read label settings" ON label_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read published label artists" ON label_artists;
CREATE POLICY "Public can read published label artists" ON label_artists
  FOR SELECT USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM label_settings WHERE public_enabled = true)
  );

DROP POLICY IF EXISTS "Public can read published label releases" ON label_releases;
CREATE POLICY "Public can read published label releases" ON label_releases
  FOR SELECT USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM label_settings WHERE public_enabled = true)
  );

INSERT INTO label_settings (public_enabled)
SELECT FALSE
WHERE NOT EXISTS (SELECT 1 FROM label_settings);
