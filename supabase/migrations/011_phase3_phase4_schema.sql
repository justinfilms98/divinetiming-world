-- PHASE 3 & 4: Events page enhancements + Media carousel
-- Events: hero_sections already supports events page
-- Media: Add carousel slides table for featured media

-- ============================================
-- MEDIA CAROUSEL SLIDES
-- Featured media for media page hero carousel
-- Admin: select, reorder, mix video+image, add captions
-- ============================================
CREATE TABLE IF NOT EXISTS media_carousel_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_carousel_order ON media_carousel_slides(display_order);

-- RLS
ALTER TABLE media_carousel_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read media_carousel" ON media_carousel_slides;
DROP POLICY IF EXISTS "Admin full media_carousel" ON media_carousel_slides;
CREATE POLICY "Public read media_carousel" ON media_carousel_slides FOR SELECT USING (true);
CREATE POLICY "Admin full media_carousel" ON media_carousel_slides FOR ALL USING (true);
