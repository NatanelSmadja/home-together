-- Home Together V3: run once in Supabase SQL Editor

alter table public.properties
  add column if not exists monthly_insurance numeric not null default 0,
  add column if not exists monthly_maintenance numeric not null default 0,
  add column if not exists monthly_transport numeric not null default 0;

create table if not exists public.household_settings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households(id) on delete cascade,
  monthly_income numeric not null default 0,
  fixed_expenses numeric not null default 0,
  current_equity numeric not null default 0,
  protected_reserve numeric not null default 0,
  desired_payment numeric not null default 0,
  maximum_payment numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.property_ratings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overall numeric not null default 0,
  location numeric not null default 0,
  layout numeric not null default 0,
  price numeric not null default 0,
  neighborhood numeric not null default 0,
  future_potential numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(property_id, user_id)
);

create table if not exists public.property_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  kind text not null check (kind in ('advantage','disadvantage')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.property_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  assigned_to uuid references auth.users(id),
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.property_comments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.property_price_history (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  old_price numeric,
  new_price numeric not null,
  changed_at timestamptz not null default now()
);

create table if not exists public.mortgage_scenarios (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  equity numeric not null default 0,
  years integer not null default 30,
  rate numeric not null default 4.8,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_milestones (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  amount numeric not null default 0,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);


create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create or replace function public.track_property_price()
returns trigger language plpgsql security definer as $$
begin
  if old.price is distinct from new.price then
    insert into public.property_price_history(property_id, old_price, new_price)
    values(new.id, old.price, new.price);
  end if;
  return new;
end;
$$;

drop trigger if exists property_price_history_trigger on public.properties;
create trigger property_price_history_trigger
after update of price on public.properties
for each row execute function public.track_property_price();

-- Helper used by all RLS policies

create or replace function public.is_household_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target
      and hm.user_id = auth.uid()
  );
$$;

alter table public.household_settings enable row level security;
alter table public.property_ratings enable row level security;
alter table public.property_items enable row level security;
alter table public.property_tasks enable row level security;
alter table public.property_comments enable row level security;
alter table public.property_price_history enable row level security;
alter table public.mortgage_scenarios enable row level security;
alter table public.payment_milestones enable row level security;
alter table public.property_documents enable row level security;

drop policy if exists household_settings_all on public.household_settings;
create policy household_settings_all on public.household_settings for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists property_ratings_all on public.property_ratings;
drop policy if exists property_ratings_select on public.property_ratings;
drop policy if exists property_ratings_insert on public.property_ratings;
drop policy if exists property_ratings_update on public.property_ratings;
create policy property_ratings_select on public.property_ratings for select to authenticated
using (exists (select 1 from public.properties p where p.id = property_ratings.property_id and public.is_household_member(p.household_id)));
create policy property_ratings_insert on public.property_ratings for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.properties p where p.id = property_ratings.property_id and public.is_household_member(p.household_id)));
create policy property_ratings_update on public.property_ratings for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists property_items_all on public.property_items;
create policy property_items_all on public.property_items for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());

drop policy if exists property_tasks_all on public.property_tasks;
create policy property_tasks_all on public.property_tasks for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists property_comments_all on public.property_comments;
create policy property_comments_all on public.property_comments for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and user_id = auth.uid());

drop policy if exists property_price_history_select on public.property_price_history;
create policy property_price_history_select on public.property_price_history for select to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_price_history.property_id and public.is_household_member(p.household_id)
  )
);

drop policy if exists mortgage_scenarios_all on public.mortgage_scenarios;
create policy mortgage_scenarios_all on public.mortgage_scenarios for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists payment_milestones_all on public.payment_milestones;
create policy payment_milestones_all on public.payment_milestones for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));


drop policy if exists property_documents_all on public.property_documents;
create policy property_documents_all on public.property_documents for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and created_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit)
values ('property-documents','property-documents',false,20971520)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists property_documents_storage_select on storage.objects;
create policy property_documents_storage_select on storage.objects for select to authenticated
using (bucket_id='property-documents' and exists (select 1 from public.household_members hm where hm.user_id=auth.uid() and hm.household_id::text=(storage.foldername(name))[1]));
drop policy if exists property_documents_storage_insert on storage.objects;
create policy property_documents_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='property-documents' and exists (select 1 from public.household_members hm where hm.user_id=auth.uid() and hm.household_id::text=(storage.foldername(name))[1]));
drop policy if exists property_documents_storage_delete on storage.objects;
create policy property_documents_storage_delete on storage.objects for delete to authenticated
using (bucket_id='property-documents' and exists (select 1 from public.household_members hm where hm.user_id=auth.uid() and hm.household_id::text=(storage.foldername(name))[1]));

do $$
declare t text;
begin
  foreach t in array array['household_settings','property_ratings','property_items','property_tasks','property_comments','mortgage_scenarios','payment_milestones','property_documents']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
