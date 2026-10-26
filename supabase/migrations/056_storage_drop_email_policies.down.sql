-- Rollback 056_storage_drop_email_policies.sql

CREATE POLICY "Admins can delete event thumbnails" ON storage.objects FOR DELETE
  USING (bucket_id = 'event-thumbnails' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can delete gallery covers" ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-covers' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can delete hero videos" ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-videos' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can delete music covers" ON storage.objects FOR DELETE
  USING (bucket_id = 'music-covers' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can upload event thumbnails" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-thumbnails' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can upload gallery covers" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-covers' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can upload hero videos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-videos' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
CREATE POLICY "Admins can upload music covers" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'music-covers' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = ANY (ARRAY['divinetiming.world@gmail.com', 'contact.exclusivelex@gmail.com'])));
