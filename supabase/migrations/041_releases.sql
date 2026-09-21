-- ============================================================
-- SPRINT 2: RELEASES (music catalogue)
--
-- Additive only. Restores a first-class music entity; the legacy
-- `music_releases` table was dropped in 000_cleanup_old_schema.sql and the
-- site has had no releases model since.
-- Rollback: run 041_releases.down.sql (drops this table only).
--
-- Security model differs deliberately from the older content tables. Those
-- carry permissive `FOR ALL USING (true)` write policies from migration 015,
-- which lets the anon role write. Releases grant public SELECT on published
-- rows only and define NO write policies: every mutation goes through
-- /api/admin/releases, which uses the service role after requireAdmin().
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  release_type TEXT NOT NULL DEFAULT 'single'
    CHECK (release_type IN ('single','ep','album','remix','compilation','mix')),
  release_date DATE,

  cover_image_url TEXT,
  external_cover_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL,

  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  soundcloud_url TEXT,
  beatport_url TEXT,

  description TEXT,
  credits TEXT,
  -- Optional embedded performance/visualiser video for the release page.
  video_url TEXT,

  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  -- 'scheduled' rows are finished but embargoed until release_date.
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','published','archived')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- "Latest release" resolves by release_date, so it needs to be cheap.
CREATE INDEX IF NOT EXISTS idx_releases_release_date
  ON releases (release_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_releases_status
  ON releases (status);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published releases" ON releases;
CREATE POLICY "Public can read published releases" ON releases
  FOR SELECT USING (status = 'published');
