-- PHASE B1: Mark known placeholder/test content as draft so it does not surface publicly.
-- Run after 031_content_publish_states.sql.

-- Events: draft if title/venue/city looks like test data
UPDATE public.events
SET status = 'draft'
WHERE status = 'published'
  AND (
    LOWER(COALESCE(title, '')) IN ('test', 'test event', 'swagland', 'weed')
    OR LOWER(COALESCE(venue, '')) IN ('test', 'test venue', 'swagland', 'weed')
    OR LOWER(COALESCE(city, '')) IN ('test', 'test city', 'swagland', 'weed')
    OR LOWER(COALESCE(title, '') || ' ' || COALESCE(venue, '') || ' ' || COALESCE(city, '')) LIKE '%test%'
    OR LOWER(COALESCE(title, '') || ' ' || COALESCE(venue, '') || ' ' || COALESCE(city, '')) LIKE '%swagland%'
    OR LOWER(COALESCE(title, '') || ' ' || COALESCE(venue, '') || ' ' || COALESCE(city, '')) LIKE '%weed%'
    OR COALESCE(description, '') LIKE '%<3%'
  );

-- Products: draft if name looks like test/placeholder
UPDATE public.products
SET status = 'draft'
WHERE status = 'published'
  AND (
    LOWER(COALESCE(name, '')) IN ('test', 'test product', 'placeholder', 'swagland', 'weed')
    OR LOWER(COALESCE(name, '')) LIKE '%test%'
    OR LOWER(COALESCE(name, '')) LIKE '%placeholder%'
  );
