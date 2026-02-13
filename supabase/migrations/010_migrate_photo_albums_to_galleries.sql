-- Migrate existing photo_albums and photos to galleries/gallery_media
-- Ensures media page has content after Phase 1 schema
-- Idempotent: skips if gallery slug already exists

DO $$
DECLARE
  album_record RECORD;
  new_gallery_id UUID;
  gallery_slug TEXT;
BEGIN
  FOR album_record IN SELECT id, title, cover_image_url, description, COALESCE(display_order, 0) as display_order FROM photo_albums
  LOOP
    gallery_slug := 'gallery-' || album_record.id::text;

    -- Skip if already migrated
    IF EXISTS (SELECT 1 FROM galleries WHERE slug = gallery_slug) THEN
      CONTINUE;
    END IF;

    -- Create gallery
    INSERT INTO galleries (name, slug, cover_image_url, description, display_order)
    VALUES (
      album_record.title,
      gallery_slug,
      album_record.cover_image_url,
      album_record.description,
      album_record.display_order
    )
    RETURNING id INTO new_gallery_id;

    -- Migrate photos to gallery_media
    INSERT INTO gallery_media (gallery_id, media_type, url, thumbnail_url, caption, display_order)
    SELECT
      new_gallery_id,
      'image',
      p.image_url,
      p.thumbnail_url,
      p.alt_text,
      COALESCE(p.display_order, 0)
    FROM photos p
    WHERE p.album_id = album_record.id;
  END LOOP;
END $$;
