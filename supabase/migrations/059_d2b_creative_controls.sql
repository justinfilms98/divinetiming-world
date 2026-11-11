-- D2-B owner-controlled creative settings. Additive and nullable only: existing rows keep their
-- values and the public site keeps today's content until an admin fills a field. No policy changes:
-- these tables stay public-read, and writes keep going through the service-role admin API.
alter table public.hero_sections
  add column if not exists secondary_cta_text text,
  add column if not exists secondary_cta_url text;

alter table public.site_settings
  add column if not exists instagram_secondary_url text,
  add column if not exists soundcloud_url text,
  add column if not exists beatport_url text,
  add column if not exists home_sections jsonb;

alter table public.page_settings
  add column if not exists section_copy jsonb;

alter table public.site_settings
  add constraint site_settings_d2b_links_https check (
    coalesce(instagram_secondary_url, 'https://') like 'https://%'
    and coalesce(soundcloud_url, 'https://') like 'https://%'
    and coalesce(beatport_url, 'https://') like 'https://%'
  ),
  add constraint site_settings_home_sections_object check (
    home_sections is null or jsonb_typeof(home_sections) = 'object'
  );

alter table public.page_settings
  add constraint page_settings_section_copy_object check (
    section_copy is null or jsonb_typeof(section_copy) = 'object'
  );
