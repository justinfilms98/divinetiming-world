-- Phase 6: Booking page story blocks (align + accent) and booking hero/contact fields

-- Story block alignment and optional motif accent
ALTER TABLE booking_content
  ADD COLUMN IF NOT EXISTS align_preference TEXT DEFAULT 'auto' CHECK (align_preference IN ('left', 'right', 'auto'));
ALTER TABLE booking_content
  ADD COLUMN IF NOT EXISTS accent TEXT CHECK (accent IS NULL OR accent IN ('star', 'clock', 'sunset', ''));

-- Sponsors/affiliations for booking page (page_settings for booking)
ALTER TABLE page_settings
  ADD COLUMN IF NOT EXISTS booking_sponsors TEXT;

-- Ensure booking hero has CTA default for "Book Now" -> #booking-form
UPDATE hero_sections
SET cta_text = COALESCE(NULLIF(trim(cta_text), ''), 'Book Now'),
    cta_url = COALESCE(NULLIF(trim(cta_url), ''), '#booking-form')
WHERE page_slug = 'booking'
  AND (cta_text IS NULL OR trim(cta_text) = '' OR cta_url IS NULL OR trim(cta_url) = '');

-- Seed 4 default story sections if none exist
INSERT INTO booking_content (title, description, display_order, align_preference, accent)
SELECT v.title, v.description, v.display_order, v.align_preference, v.accent
FROM (VALUES
  ('We are Divine Timing'::text, 'We are an electronic duo crafting moments between rhythm and reflection. Our sound lives at the intersection of dance and contemplation.'::text, 0, 'left'::text, NULL::text),
  ('What Divine Timing means', 'Divine Timing is the belief that the right moment finds you when you are ready. Our music is an invitation to that moment.', 1, 'right', NULL),
  ('How it started', 'From shared sessions to festival stages, we built this project on trust in the process and in each other.', 2, 'left', NULL),
  ('Our goal', 'We want to bring this energy to your event—whether a club night, a festival, or a unique collaboration. Let''s create something together.', 3, 'right', NULL)
) AS v(title, description, display_order, align_preference, accent)
WHERE NOT EXISTS (SELECT 1 FROM booking_content LIMIT 1);
