-- הרץ את כל הקובץ ב-Supabase > SQL Editor > New query
create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  primary key (household_id,user_id)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  city text not null,
  neighborhood text,
  address text,
  transaction_type text not null check (transaction_type in ('buy','rent','lottery','paper')),
  status text not null default 'checking' check (status in ('checking','favorite','rejected','completed')),
  price numeric(14,2) not null default 0,
  rooms numeric(4,1),
  size_sqm numeric(8,2),
  equity numeric(14,2) not null default 0,
  monthly_rent numeric(12,2) not null default 0,
  notes text,
  main_image_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','doing','done')),
  assigned_to uuid references auth.users(id),
  due_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.property_notes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at before update on public.properties for each row execute function public.set_updated_at();

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.properties enable row level security;
alter table public.property_tasks enable row level security;
alter table public.property_notes enable row level security;

create or replace function public.is_household_member(target uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.household_members hm where hm.household_id=target and hm.user_id=auth.uid());
$$;

create policy "profiles visible to authenticated" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (id=auth.uid());
create policy "members see household" on public.households for select to authenticated using (public.is_household_member(id));
create policy "members see memberships" on public.household_members for select to authenticated using (public.is_household_member(household_id));
create policy "members read properties" on public.properties for select to authenticated using (public.is_household_member(household_id));
create policy "members insert properties" on public.properties for insert to authenticated with check (public.is_household_member(household_id) and created_by=auth.uid());
create policy "members update properties" on public.properties for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "members delete properties" on public.properties for delete to authenticated using (public.is_household_member(household_id));
create policy "members read tasks" on public.property_tasks for select to authenticated using (exists(select 1 from public.properties p where p.id=property_id and public.is_household_member(p.household_id)));
create policy "members manage tasks" on public.property_tasks for all to authenticated using (exists(select 1 from public.properties p where p.id=property_id and public.is_household_member(p.household_id))) with check (exists(select 1 from public.properties p where p.id=property_id and public.is_household_member(p.household_id)));
create policy "members read notes" on public.property_notes for select to authenticated using (exists(select 1 from public.properties p where p.id=property_id and public.is_household_member(p.household_id)));
create policy "members insert notes" on public.property_notes for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.properties p where p.id=property_id and public.is_household_member(p.household_id)));

-- Realtime לטבלאות המרכזיות
alter publication supabase_realtime add table public.properties;
alter publication supabase_realtime add table public.property_tasks;
alter publication supabase_realtime add table public.property_notes;
