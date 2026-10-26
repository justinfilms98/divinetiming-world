-- ============================================================
-- RLS lockdown. Removes legacy `FOR ALL USING (true)` policies
-- (role PUBLIC, so anon could write) and limits reads of drafts
-- to admins. All admin writes go through service-role API routes;
-- the Stripe webhook and checkout writes use the service role too.
-- Rollback: 054_rls_lockdown.down.sql (restores prior policies).
-- ============================================================

-- Admin check backed by admin_users (was a hard-coded email list).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER FUNCTION public.current_user_email() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO service_role;

ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.decrement_inventory(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_product_inventory(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_inventory(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_product_inventory(uuid, integer) TO service_role;

-- ---------- admin_users: self-read only ----------
DROP POLICY IF EXISTS "Admin full access" ON admin_users;
CREATE POLICY "Admins read own row" ON admin_users
  FOR SELECT TO authenticated
  USING (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------- orders: service role only ----------
DROP POLICY IF EXISTS "Admin full access" ON orders;
DROP POLICY IF EXISTS "Admin full access" ON order_items;

-- ---------- status-gated content ----------
DROP POLICY IF EXISTS "Admin full access" ON events;
DROP POLICY IF EXISTS "Auth insert events" ON events;
DROP POLICY IF EXISTS "Auth users can insert events" ON events;
DROP POLICY IF EXISTS "Auth users can update events" ON events;
DROP POLICY IF EXISTS "Public read access" ON events;
CREATE POLICY "Anon read published events" ON events
  FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Auth read published or admin events" ON events
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admin full galleries" ON galleries;
DROP POLICY IF EXISTS "Public read galleries" ON galleries;
CREATE POLICY "Anon read published galleries" ON galleries
  FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Auth read published or admin galleries" ON galleries
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access" ON videos;
DROP POLICY IF EXISTS "Public read access" ON videos;
CREATE POLICY "Anon read published videos" ON videos
  FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Auth read published or admin videos" ON videos
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access" ON products;
DROP POLICY IF EXISTS "Public read access" ON products;
CREATE POLICY "Anon read live products" ON products
  FOR SELECT TO anon USING (is_active = true AND status = 'published');
CREATE POLICY "Auth read live or admin products" ON products
  FOR SELECT TO authenticated
  USING ((is_active = true AND status = 'published') OR public.is_admin());

-- ---------- public-read tables: drop open write policies ----------
DROP POLICY IF EXISTS "Admin full about_content" ON about_content;
DROP POLICY IF EXISTS "Admin full about_photos" ON about_photos;
DROP POLICY IF EXISTS "Admin full about_timeline" ON about_timeline;
DROP POLICY IF EXISTS "Admin full booking_content" ON booking_content;
DROP POLICY IF EXISTS "Admin full event_media" ON event_media;
DROP POLICY IF EXISTS "Admin full gallery_media" ON gallery_media;
DROP POLICY IF EXISTS "Admin full hero_sections" ON hero_sections;
DROP POLICY IF EXISTS "Auth update hero sections" ON hero_sections;
DROP POLICY IF EXISTS "Auth users can update hero sections" ON hero_sections;
DROP POLICY IF EXISTS "Admin full media_carousel" ON media_carousel_slides;
DROP POLICY IF EXISTS "Admin full page_settings" ON page_settings;
DROP POLICY IF EXISTS "Admin full access" ON photo_albums;
DROP POLICY IF EXISTS "Admin full access" ON photos;
DROP POLICY IF EXISTS "Admin full access" ON product_images;
DROP POLICY IF EXISTS "Admin full access" ON product_variants;
DROP POLICY IF EXISTS "Admin full access" ON site_settings;

-- ---------- media library: any signed-in user could write ----------
DROP POLICY IF EXISTS "Authenticated read all media assets" ON external_media_assets;
DROP POLICY IF EXISTS "Authenticated write media assets" ON external_media_assets;
CREATE POLICY "Auth read public or admin media assets" ON external_media_assets
  FOR SELECT TO authenticated
  USING ((is_archived = false AND usage_type <> 'internal') OR public.is_admin());
CREATE POLICY "Admins write media assets" ON external_media_assets
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- inbox PII: any signed-in user could read ----------
DROP POLICY IF EXISTS "Admin read booking_inquiries" ON booking_inquiries;
CREATE POLICY "Admins read booking_inquiries" ON booking_inquiries
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can read subscribers" ON subscribers;
CREATE POLICY "Admins read subscribers" ON subscribers
  FOR SELECT TO authenticated USING (public.is_admin());
