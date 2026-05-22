-- ============================================
-- EVENT MEDIA
-- Per-event media library: promo photos/videos shown on the event detail page
-- (separate from galleries — these are scoped to a single event).
-- ============================================

CREATE TABLE IF NOT EXISTS event_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  external_media_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL,
  url TEXT,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_media_event ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_order ON event_media(event_id, display_order);

ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;

-- Public read (display on event detail page)
CREATE POLICY "Public read event_media" ON event_media FOR SELECT USING (true);

-- Admin full access (gate enforced in app middleware, same pattern as other admin tables)
CREATE POLICY "Admin full event_media" ON event_media FOR ALL USING (true) WITH CHECK (true);
