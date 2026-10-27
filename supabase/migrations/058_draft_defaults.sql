-- New events, collections, products and media uploads default to hidden. Column defaults only apply to
-- future inserts that omit the value; existing rows and their statuses are untouched.
alter table public.events alter column status set default 'draft';
alter table public.galleries alter column status set default 'draft';
alter table public.products alter column status set default 'draft';
alter table public.products alter column is_active set default false;
alter table public.external_media_assets alter column usage_type set default 'internal';
