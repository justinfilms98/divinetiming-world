-- PHASE 1: Core Content Architecture
-- Centralized content system - all pages pull from DB, no hardcoded content

-- ============================================
-- PAGE SETTINGS
-- Per-page configuration: SEO, meta, page-level options
-- ============================================
CREATE TABLE page_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug TEXT NOT NULL UNIQUE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_settings_slug ON page_settings(page_slug);

-- Seed default pages
INSERT INTO page_settings (page_slug, seo_title, seo_description) VALUES
  ('home', 'DIVINE:TIMING', 'Live, evolving, in motion.'),
  ('events', 'Events | DIVINE:TIMING', 'Upcoming shows and tour dates.'),
  ('media', 'Media | DIVINE:TIMING', 'Photos and videos from our journey.'),
  ('shop', 'Shop | DIVINE:TIMING', 'Official merchandise.'),
  ('booking', 'Booking | DIVINE:TIMING', 'Book DIVINE:TIMING for your event.'),
  ('about', 'About | DIVINE:TIMING', 'The story behind the music.');

-- ============================================
-- HERO SECTIONS
-- Per-page hero config: media, overlay, text, CTA, animation
-- ============================================
CREATE TABLE hero_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL DEFAULT 'default' CHECK (media_type IN ('image', 'video', 'default')),
  media_url TEXT,
  overlay_opacity NUMERIC(3,2) DEFAULT 0.4 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 1),
  headline TEXT,
  subtext TEXT,
  cta_text TEXT,
  cta_url TEXT,
  animation_type TEXT DEFAULT 'warp' CHECK (animation_type IN ('warp', 'clock', 'none')),
  animation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hero_sections_slug ON hero_sections(page_slug);

-- Seed hero sections (inherit from site_settings for home)
INSERT INTO hero_sections (page_slug, media_type, media_url, overlay_opacity, headline, animation_type, animation_enabled)
SELECT 'home', COALESCE(hero_media_type, 'default'), hero_media_url, 0.4, 'DIVINE:TIMING', 'warp', true
FROM site_settings LIMIT 1;

-- Fallback if site_settings is empty
INSERT INTO hero_sections (page_slug, media_type, overlay_opacity, headline, animation_type, animation_enabled)
SELECT 'home', 'default', 0.4, 'DIVINE:TIMING', 'warp', true
WHERE NOT EXISTS (SELECT 1 FROM hero_sections WHERE page_slug = 'home');

INSERT INTO hero_sections (page_slug, media_type, headline, subtext) VALUES
  ('events', 'default', 'Events', 'Where we''ll be next'),
  ('media', 'default', 'Media', 'Our journey in images'),
  ('shop', 'default', 'Shop', 'Official merchandise'),
  ('booking', 'default', 'Booking', 'Let''s create something together'),
  ('about', 'default', 'About', 'The story behind the music');

-- ============================================
-- EVENTS (Enhance existing table)
-- Add: title, description, time, thumbnail_url, display_order
-- ============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Backfill: use city as title if null
UPDATE events SET title = city WHERE title IS NULL;
UPDATE events SET display_order = 0 WHERE display_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_display_order ON events(display_order);

-- ============================================
-- GALLERIES
-- Gallery collections (replaces photo_albums concept for Phase 2+)
-- ============================================
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_galleries_slug ON galleries(slug);
CREATE INDEX idx_galleries_order ON galleries(display_order);

-- ============================================
-- GALLERY MEDIA
-- Media items within galleries (images + videos)
-- ============================================
CREATE TABLE gallery_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_media_gallery ON gallery_media(gallery_id);
CREATE INDEX idx_gallery_media_order ON gallery_media(display_order);

-- ============================================
-- BOOKING CONTENT
-- EPK-style sections for booking page
-- ============================================
CREATE TABLE booking_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_content_order ON booking_content(display_order);

-- Seed default booking pitch (from site_settings)
INSERT INTO booking_content (title, description, display_order)
SELECT 'Get in Touch', 'For booking inquiries, vendor information, and management requests, please contact us using the information below.', 0
WHERE NOT EXISTS (SELECT 1 FROM booking_content LIMIT 1);

-- ============================================
-- ABOUT CONTENT
-- Main about page content
-- ============================================
CREATE TABLE about_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bio_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About photos (reorderable)
CREATE TABLE about_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_about_photos_order ON about_photos(display_order);

-- About timeline sections
CREATE TABLE about_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_about_timeline_order ON about_timeline(display_order);

-- Seed about_content from presskit (with fallback)
INSERT INTO about_content (bio_text)
SELECT COALESCE((SELECT bio_text FROM presskit LIMIT 1), 'DIVINE:TIMING are a unique duo who integrate live percussion and vocals into their performances.')
WHERE NOT EXISTS (SELECT 1 FROM about_content LIMIT 1);

-- ============================================
-- SOCIAL LINKS (Admin-configurable)
-- Extend site_settings or use dedicated table
-- site_settings already has: instagram_url, youtube_url, spotify_url, apple_music_url
-- Keep using site_settings for social links
-- ============================================

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_timeline ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read page_settings" ON page_settings FOR SELECT USING (true);
CREATE POLICY "Public read hero_sections" ON hero_sections FOR SELECT USING (true);
CREATE POLICY "Public read galleries" ON galleries FOR SELECT USING (true);
CREATE POLICY "Public read gallery_media" ON gallery_media FOR SELECT USING (true);
CREATE POLICY "Public read booking_content" ON booking_content FOR SELECT USING (true);
CREATE POLICY "Public read about_content" ON about_content FOR SELECT USING (true);
CREATE POLICY "Public read about_photos" ON about_photos FOR SELECT USING (true);
CREATE POLICY "Public read about_timeline" ON about_timeline FOR SELECT USING (true);

-- Admin full access (RLS uses service role for admin)
CREATE POLICY "Admin full page_settings" ON page_settings FOR ALL USING (true);
CREATE POLICY "Admin full hero_sections" ON hero_sections FOR ALL USING (true);
CREATE POLICY "Admin full galleries" ON galleries FOR ALL USING (true);
CREATE POLICY "Admin full gallery_media" ON gallery_media FOR ALL USING (true);
CREATE POLICY "Admin full booking_content" ON booking_content FOR ALL USING (true);
CREATE POLICY "Admin full about_content" ON about_content FOR ALL USING (true);
CREATE POLICY "Admin full about_photos" ON about_photos FOR ALL USING (true);
CREATE POLICY "Admin full about_timeline" ON about_timeline FOR ALL USING (true);
