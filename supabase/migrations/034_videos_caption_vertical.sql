-- Phase AK: Videos — caption and vertical/short-form flag for Media experience
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_vertical BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN public.videos.caption IS 'Optional caption for display on media page.';
COMMENT ON COLUMN public.videos.is_vertical IS 'When true, treat as vertical short-form (9:16) for feed/player layout.';
