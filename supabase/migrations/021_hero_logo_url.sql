-- Step 2: Hero logo (PNG) for home page title
-- Stores Uploadcare CDN URL; when set, frontend shows logo image instead of text headline.
ALTER TABLE hero_sections ADD COLUMN IF NOT EXISTS hero_logo_url TEXT;
