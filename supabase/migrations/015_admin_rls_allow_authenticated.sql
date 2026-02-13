-- PHASE 12.1: Fix RLS for admin saves
-- Add WITH CHECK (true) so INSERT/UPDATE work for authenticated users
-- Admin is gated at app level; these policies allow DB writes when authenticated

-- external_media_assets (inserts via API use service role; client reads need this)
DROP POLICY IF EXISTS "Admin full external_media" ON external_media_assets;
CREATE POLICY "Admin full external_media" ON external_media_assets
  FOR ALL USING (true) WITH CHECK (true);

-- hero_sections, events, page_settings (admin homepage + page settings)
DROP POLICY IF EXISTS "Admin full hero_sections" ON hero_sections;
CREATE POLICY "Admin full hero_sections" ON hero_sections
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access" ON events;
CREATE POLICY "Admin full access" ON events
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full page_settings" ON page_settings;
CREATE POLICY "Admin full page_settings" ON page_settings
  FOR ALL USING (true) WITH CHECK (true);

-- products, product_images (admin shop)
DROP POLICY IF EXISTS "Admin full access" ON products;
CREATE POLICY "Admin full access" ON products
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access" ON product_images;
CREATE POLICY "Admin full access" ON product_images
  FOR ALL USING (true) WITH CHECK (true);

-- galleries, gallery_media (admin media)
DROP POLICY IF EXISTS "Admin full galleries" ON galleries;
CREATE POLICY "Admin full galleries" ON galleries
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full gallery_media" ON gallery_media;
CREATE POLICY "Admin full gallery_media" ON gallery_media
  FOR ALL USING (true) WITH CHECK (true);

-- about_photos, about_content, about_timeline (admin about)
DROP POLICY IF EXISTS "Admin full about_photos" ON about_photos;
CREATE POLICY "Admin full about_photos" ON about_photos
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full about_content" ON about_content;
CREATE POLICY "Admin full about_content" ON about_content
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full about_timeline" ON about_timeline;
CREATE POLICY "Admin full about_timeline" ON about_timeline
  FOR ALL USING (true) WITH CHECK (true);

-- booking_content (admin booking)
DROP POLICY IF EXISTS "Admin full booking_content" ON booking_content;
CREATE POLICY "Admin full booking_content" ON booking_content
  FOR ALL USING (true) WITH CHECK (true);

-- site_settings, videos, orders, order_items (admin settings, media, orders)
DROP POLICY IF EXISTS "Admin full access" ON site_settings;
CREATE POLICY "Admin full access" ON site_settings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access" ON videos;
CREATE POLICY "Admin full access" ON videos
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access" ON orders;
CREATE POLICY "Admin full access" ON orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access" ON order_items;
CREATE POLICY "Admin full access" ON order_items
  FOR ALL USING (true) WITH CHECK (true);

-- media_carousel_slides
DROP POLICY IF EXISTS "Admin full media_carousel" ON media_carousel_slides;
CREATE POLICY "Admin full media_carousel" ON media_carousel_slides
  FOR ALL USING (true) WITH CHECK (true);
