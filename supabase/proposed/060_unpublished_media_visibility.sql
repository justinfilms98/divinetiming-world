-- ============================================================
-- 060 Unpublished media visibility (security).
-- PROPOSED FOR PRODUCTION, NOT APPLIED THERE. Applied to staging on 2026-11-11
-- for testing (staging migration 20261111085819). Move to supabase/migrations/
-- only after owner approval. The Journal migration becomes 061.
--
-- 1. Child media rows follow their parent's visibility. Before this, anyone
--    could read every row of gallery_media, event_media, product_images and
--    product_variants, including rows that belong to draft collections, draft
--    events or hidden products.
-- 2. Storage objects can no longer be listed by visitors. Every bucket stays
--    public, so files load by their link exactly as before (public object
--    URLs don't consult these policies); only the list/search API and direct
--    row reads of storage.objects become admin-only.
--
-- Nothing is deleted or moved; no data changes. Server code using the
-- service role (admin APIs, overview storage totals) is unaffected.
-- Rollback: 060_unpublished_media_visibility.down.sql restores the prior policies
-- byte for byte (verified on staging).
-- ============================================================

-- ---------- gallery_media: only media of published collections ----------
drop policy if exists "Public read gallery_media" on public.gallery_media;
create policy "Anon read published gallery_media" on public.gallery_media
  for select to anon
  using (exists (
    select 1 from public.galleries g
    where g.id = gallery_id and g.status = 'published'
  ));
create policy "Auth read published or admin gallery_media" on public.gallery_media
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.galleries g
      where g.id = gallery_id and g.status = 'published'
    )
  );

-- ---------- event_media: only media of published events ----------
drop policy if exists "Public read event_media" on public.event_media;
create policy "Anon read published event_media" on public.event_media
  for select to anon
  using (exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published'
  ));
create policy "Auth read published or admin event_media" on public.event_media
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published'
    )
  );

-- ---------- product_images / product_variants: only live products ----------
drop policy if exists "Public read access" on public.product_images;
create policy "Anon read live product_images" on public.product_images
  for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.is_active = true and p.status = 'published'
  ));
create policy "Auth read live or admin product_images" on public.product_images
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true and p.status = 'published'
    )
  );

drop policy if exists "Public read access" on public.product_variants;
create policy "Anon read live product_variants" on public.product_variants
  for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.is_active = true and p.status = 'published'
  ));
create policy "Auth read live or admin product_variants" on public.product_variants
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true and p.status = 'published'
    )
  );

-- ---------- storage: no listing for visitors ----------
drop policy if exists "Public read all buckets" on storage.objects;
drop policy if exists "Public can read media bucket" on storage.objects;
drop policy if exists "media_select" on storage.objects;
drop policy if exists "public_media_select" on storage.objects;
drop policy if exists "Public can view hero videos" on storage.objects;
drop policy if exists "Public can view event thumbnails" on storage.objects;
drop policy if exists "Public can view gallery covers" on storage.objects;
drop policy if exists "Public can view music covers" on storage.objects;

-- Admin uploads, replacements and the Media Library keep working through this.
create policy "Admins read objects" on storage.objects
  for select to authenticated
  using (public.is_admin());
