-- ============================================
-- JOURNEY BLOCKS
-- Ordered story blocks for the new public /journey page.
-- Replaces the booking story pattern; each block is image + title + body
-- with alternating alignment for an editorial scroll.
-- ============================================

CREATE TABLE IF NOT EXISTS journey_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  body TEXT,
  image_url TEXT,
  external_image_asset_id UUID REFERENCES external_media_assets(id) ON DELETE SET NULL,
  align TEXT CHECK (align IN ('left', 'right', 'center')) DEFAULT 'left',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_blocks_order ON journey_blocks(display_order);

ALTER TABLE journey_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read journey_blocks" ON journey_blocks FOR SELECT USING (true);
CREATE POLICY "Admin full journey_blocks" ON journey_blocks FOR ALL USING (true) WITH CHECK (true);

-- Seed one placeholder block so the page is non-empty on first deploy.
INSERT INTO journey_blocks (title, body, align, display_order)
SELECT
  'Our story',
  'Replace this placeholder with the opening of your journey — how you met, the first show, what the music means to you. Add images and additional blocks in the admin to build a scrolling narrative.',
  'left',
  0
WHERE NOT EXISTS (SELECT 1 FROM journey_blocks LIMIT 1);
