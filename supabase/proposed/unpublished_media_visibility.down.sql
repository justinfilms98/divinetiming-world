-- Rollback for unpublished_media_visibility.sql: restores the exact policies in place on
-- 2026-11-11 (read from production and staging, which matched). Re-opens the exposure.

drop policy if exists "Anon read published gallery_media" on public.gallery_media;
drop policy if exists "Auth read published or admin gallery_media" on public.gallery_media;
create policy "Public read gallery_media" on public.gallery_media for select using (true);

drop policy if exists "Anon read published event_media" on public.event_media;
drop policy if exists "Auth read published or admin event_media" on public.event_media;
create policy "Public read event_media" on public.event_media for select using (true);

drop policy if exists "Anon read live product_images" on public.product_images;
drop policy if exists "Auth read live or admin product_images" on public.product_images;
create policy "Public read access" on public.product_images for select using (true);

drop policy if exists "Anon read live product_variants" on public.product_variants;
drop policy if exists "Auth read live or admin product_variants" on public.product_variants;
create policy "Public read access" on public.product_variants for select using (true);

drop policy if exists "Admins read objects" on storage.objects;
create policy "Public read all buckets" on storage.objects for select using (true);
create policy "Public can read media bucket" on storage.objects for select using (bucket_id = 'media');
create policy "media_select" on storage.objects for select using (bucket_id = 'media');
create policy "public_media_select" on storage.objects for select using (bucket_id = 'public-media');
create policy "Public can view hero videos" on storage.objects for select using (bucket_id = 'hero-videos');
create policy "Public can view event thumbnails" on storage.objects for select using (bucket_id = 'event-thumbnails');
create policy "Public can view gallery covers" on storage.objects for select using (bucket_id = 'gallery-covers');
create policy "Public can view music covers" on storage.objects for select using (bucket_id = 'music-covers');
