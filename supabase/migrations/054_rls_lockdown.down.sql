-- Rollback 054_rls_lockdown.sql
-- WARNING: restores the previous OPEN policies (anon could read/write).
-- Use only to recover from a breaking regression, then re-apply a fix.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT email IN ('divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com')
     FROM auth.users
     WHERE id = auth.uid()),
    false
  );
$$;
ALTER FUNCTION public.is_admin() RESET search_path;
GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC, anon, authenticated;

ALTER FUNCTION public.current_user_email() RESET search_path;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO PUBLIC, anon, authenticated;

ALTER FUNCTION public.update_updated_at_column() RESET search_path;

GRANT EXECUTE ON FUNCTION public.decrement_inventory(uuid, integer) TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_inventory(uuid, integer) TO PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Admins read own row" ON admin_users;
CREATE POLICY "Admin full access" ON admin_users FOR ALL USING (true);

CREATE POLICY "Admin full access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon read published events" ON events;
DROP POLICY IF EXISTS "Auth read published or admin events" ON events;
CREATE POLICY "Admin full access" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth insert events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can insert events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update events" ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon read published galleries" ON galleries;
DROP POLICY IF EXISTS "Auth read published or admin galleries" ON galleries;
CREATE POLICY "Admin full galleries" ON galleries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read galleries" ON galleries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon read published videos" ON videos;
DROP POLICY IF EXISTS "Auth read published or admin videos" ON videos;
CREATE POLICY "Admin full access" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon read live products" ON products;
DROP POLICY IF EXISTS "Auth read live or admin products" ON products;
CREATE POLICY "Admin full access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read access" ON products FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full about_content" ON about_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full about_photos" ON about_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full about_timeline" ON about_timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full booking_content" ON booking_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full event_media" ON event_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full gallery_media" ON gallery_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full hero_sections" ON hero_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth update hero sections" ON hero_sections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can update hero sections" ON hero_sections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full media_carousel" ON media_carousel_slides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full page_settings" ON page_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON photo_albums FOR ALL USING (true);
CREATE POLICY "Admin full access" ON photos FOR ALL USING (true);
CREATE POLICY "Admin full access" ON product_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON site_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth read public or admin media assets" ON external_media_assets;
DROP POLICY IF EXISTS "Admins write media assets" ON external_media_assets;
CREATE POLICY "Authenticated read all media assets" ON external_media_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write media assets" ON external_media_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read booking_inquiries" ON booking_inquiries;
CREATE POLICY "Admin read booking_inquiries" ON booking_inquiries FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins read subscribers" ON subscribers;
CREATE POLICY "Authenticated can read subscribers" ON subscribers FOR SELECT USING (auth.role() = 'authenticated');
