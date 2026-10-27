alter table public.events alter column status set default 'published';
alter table public.galleries alter column status set default 'published';
alter table public.products alter column status set default 'published';
alter table public.products alter column is_active set default true;
alter table public.external_media_assets alter column usage_type set default 'public';
