-- ============================================================
-- 060 Journal (D2-C): vlog episodes and travel stories.
-- PROPOSED, NOT APPLIED. Move to supabase/migrations/ only after owner approval.
--
-- Additive only: two new tables, nothing existing is altered.
-- Security follows 041/054: RLS on, read policies only, no write policies.
-- Every write goes through /api/admin/journal, which uses the service role
-- after requireAdmin(). Direct writes by anon/authenticated are also revoked.
--
-- Visibility:
--   draft        admins only
--   coming_soon  public card/teaser (every journal_episodes column is readable);
--                the video stays private
--   published    public, including the video
--   archived     admins only
-- Scheduling is informational in this version: scheduled_for and release_note
-- are shown on coming-soon episodes, but nothing publishes automatically.
--
-- Rollback: supabase/proposed/060_journal.down.sql (drops both tables and
-- everything in them; export first if any episodes exist).
-- ============================================================

create table if not exists public.journal_episodes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  episode_number integer
    check (episode_number is null or episode_number between 1 and 9999),
  title text not null
    check (length(btrim(title)) between 1 and 120),
  location text
    check (location is null or length(location) <= 80),
  -- Card text and default meta description.
  summary text
    check (summary is null or length(summary) <= 300),
  -- Plain text; blank lines become paragraphs on the public page.
  description text
    check (description is null or length(description) <= 5000),
  cover_image_url text
    check (cover_image_url is null or cover_image_url like 'https://%'),
  external_cover_asset_id uuid
    references public.external_media_assets(id) on delete set null,
  cover_alt text
    check (cover_alt is null or length(cover_alt) <= 200),
  -- Optional photo set from Collections, shown on the episode page only when published.
  gallery_id uuid
    references public.galleries(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'coming_soon', 'published', 'archived')),
  -- Optional teaser line for coming-soon episodes, e.g. "Coming in December".
  release_note text
    check (release_note is null or length(release_note) <= 60),
  -- Optional planned release time, shown on coming-soon episodes only.
  scheduled_for timestamptz,
  -- Set by the API the first time the episode is published.
  published_at timestamptz,
  display_order integer not null default 0,
  seo_title text
    check (seo_title is null or length(seo_title) <= 70),
  seo_description text
    check (seo_description is null or length(seo_description) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_episodes_published_has_date
    check (status <> 'published' or published_at is not null)
);

-- One live episode per number; archived episodes keep theirs without blocking reuse.
create unique index if not exists journal_episodes_number_live
  on public.journal_episodes (episode_number)
  where episode_number is not null and status <> 'archived';

create index if not exists journal_episodes_public_order
  on public.journal_episodes (status, display_order, episode_number desc);

-- Video reference kept apart so it stays private until the episode is published.
create table if not exists public.journal_episode_videos (
  episode_id uuid primary key
    references public.journal_episodes(id) on delete cascade,
  provider text not null
    check (provider in ('youtube', 'vimeo')),
  video_id text not null,
  is_vertical boolean not null default false,
  duration_seconds integer
    check (duration_seconds is null or duration_seconds between 1 and 86400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_episode_videos_id_format check (
    (provider = 'youtube' and video_id ~ '^[A-Za-z0-9_-]{11}$')
    or (provider = 'vimeo' and video_id ~ '^[0-9]{6,12}$')
  )
);

create trigger journal_episodes_updated_at
  before update on public.journal_episodes
  for each row execute function public.update_updated_at_column();

create trigger journal_episode_videos_updated_at
  before update on public.journal_episode_videos
  for each row execute function public.update_updated_at_column();

alter table public.journal_episodes enable row level security;
alter table public.journal_episode_videos enable row level security;

create policy "Anon read public journal episodes" on public.journal_episodes
  for select to anon
  using (status in ('published', 'coming_soon'));

create policy "Auth read public or admin journal episodes" on public.journal_episodes
  for select to authenticated
  using (status in ('published', 'coming_soon') or public.is_admin());

create policy "Anon read published journal videos" on public.journal_episode_videos
  for select to anon
  using (exists (
    select 1 from public.journal_episodes e
    where e.id = episode_id and e.status = 'published'
  ));

create policy "Auth read published or admin journal videos" on public.journal_episode_videos
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.journal_episodes e
      where e.id = episode_id and e.status = 'published'
    )
  );

revoke insert, update, delete, truncate
  on public.journal_episodes, public.journal_episode_videos
  from anon, authenticated;
