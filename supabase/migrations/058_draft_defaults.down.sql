alter table public.events alter column status set default 'published';
alter table public.galleries alter column status set default 'published';
alter table public.products alter column status set default 'published';
alter table public.products alter column is_active set default true;
