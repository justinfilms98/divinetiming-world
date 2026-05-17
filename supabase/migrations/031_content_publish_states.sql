-- PHASE B1: Formal publish states (Draft / Published / Archived)
-- Public pages must only render Published content.

-- ============================================
-- EVENTS
-- ============================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
COMMENT ON COLUMN public.events.status IS 'draft = hidden from public; published = visible; archived = hidden, kept for history.';

-- ============================================
-- PRODUCTS (keep is_active for backward compat; status is source of truth)
-- ============================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));

-- Backfill: is_active = false -> draft, true -> published
UPDATE public.products SET status = 'draft' WHERE is_active = false AND (status IS NULL OR status = 'published');
UPDATE public.products SET status = 'published' WHERE is_active = true AND (status IS NULL OR status = 'published');

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
COMMENT ON COLUMN public.products.status IS 'draft = hidden from shop; published = visible; archived = hidden.';

-- ============================================
-- GALLERIES (collections)
-- ============================================
ALTER TABLE public.galleries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_galleries_status ON public.galleries(status);
COMMENT ON COLUMN public.galleries.status IS 'draft = hidden from media hub; published = visible; archived = hidden.';

-- ============================================
-- VIDEOS
-- ============================================
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
COMMENT ON COLUMN public.videos.status IS 'draft = hidden from media page; published = visible; archived = hidden.';

-- Public visibility is enforced in application code (getEvents, getProducts, etc.)
-- which filter by status = 'published'. RLS left unchanged to avoid breaking admin.
