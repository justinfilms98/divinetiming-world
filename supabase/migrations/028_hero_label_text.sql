-- Phase 5: Editable label text per hero (replaces hard-coded "Electronic duo").
ALTER TABLE public.hero_sections
  ADD COLUMN IF NOT EXISTS label_text TEXT;

COMMENT ON COLUMN public.hero_sections.label_text IS 'Optional small-caps label above headline (e.g. ELECTRONIC DUO). Blank = do not render.';
