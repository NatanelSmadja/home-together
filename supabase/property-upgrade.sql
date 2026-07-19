-- יש להריץ פעם אחת ב-Supabase: SQL Editor → New query → Run

alter table public.properties
  add column if not exists balcony_sqm numeric,
  add column if not exists floor numeric,
  add column if not exists total_floors numeric,
  add column if not exists bathrooms numeric,
  add column if not exists parking_spaces integer,
  add column if not exists storage_sqm numeric,
  add column if not exists property_condition text,
  add column if not exists monthly_arnona numeric not null default 0,
  add column if not exists monthly_building_fee numeric not null default 0;

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.property_images enable row level security;

drop policy if exists "Household members can view property images" on public.property_images;
create policy "Household members can view property images"
on public.property_images for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = property_images.household_id
      and hm.user_id = auth.uid()
  )
);

drop policy if exists "Household members can add property images" on public.property_images;
create policy "Household members can add property images"
on public.property_images for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.household_members hm
    where hm.household_id = property_images.household_id
      and hm.user_id = auth.uid()
  )
);

drop policy if exists "Household members can delete property images" on public.property_images;
create policy "Household members can delete property images"
on public.property_images for delete
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = property_images.household_id
      and hm.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can view property image objects" on storage.objects;
create policy "Authenticated users can view property image objects"
on storage.objects for select
to authenticated
using (bucket_id = 'property-images');

drop policy if exists "Household members can upload property image objects" on storage.objects;
create policy "Household members can upload property image objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and exists (
    select 1
    from public.household_members hm
    where hm.user_id = auth.uid()
      and hm.household_id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Household members can delete property image objects" on storage.objects;
create policy "Household members can delete property image objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and exists (
    select 1
    from public.household_members hm
    where hm.user_id = auth.uid()
      and hm.household_id::text = (storage.foldername(name))[1]
  )
);

do $$
begin
  alter publication supabase_realtime add table public.property_images;
exception
  when duplicate_object then null;
end $$;
