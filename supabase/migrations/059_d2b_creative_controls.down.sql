alter table public.page_settings drop constraint if exists page_settings_section_copy_object;
alter table public.site_settings drop constraint if exists site_settings_home_sections_object;
alter table public.site_settings drop constraint if exists site_settings_d2b_links_https;

alter table public.page_settings drop column if exists section_copy;

alter table public.site_settings
  drop column if exists home_sections,
  drop column if exists beatport_url,
  drop column if exists soundcloud_url,
  drop column if exists instagram_secondary_url;

alter table public.hero_sections
  drop column if exists secondary_cta_url,
  drop column if exists secondary_cta_text;
