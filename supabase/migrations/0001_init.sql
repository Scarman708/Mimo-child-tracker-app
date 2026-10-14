-- MIMO initial schema: profiles, children, memberships, events, shortcuts, reminders, timers
create extension if not exists "pgcrypto";

create type member_role as enum ('admin', 'caregiver', 'viewer');
create type unit_system as enum ('metric', 'imperial');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  locale text default 'en',
  theme text default 'system',
  time_format text default '12h',
  last_child_id uuid,
  created_at timestamptz default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  birth_date date not null check (birth_date <= current_date),
  photo_path text,
  unit_system unit_system not null default 'metric',
  created_by uuid not null references auth.users,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users on delete cascade,
  child_id uuid not null references public.children on delete cascade,
  role member_role not null default 'caregiver',
  relationship text,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  unique (account_id, child_id)
);

create table public.events (
  id uuid primary key,                       -- client-generated UUID = idempotency key
  child_id uuid not null references public.children on delete cascade,
  category text not null,
  subtype text,
  started_at timestamptz not null,
  ended_at timestamptz,
  local_timezone text,
  payload jsonb not null default '{}',
  note text,
  creator_id uuid not null references auth.users,
  updated_by uuid references auth.users,
  version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index events_child_time on public.events (child_id, started_at desc);

create table public.timer_sessions (
  id uuid primary key,
  child_id uuid not null references public.children on delete cascade,
  event_id uuid references public.events,
  timer_kind text not null,                  -- sleep, breast_left, breast_right, pump_left...
  segments jsonb not null default '[]',      -- [{start, end|null}]
  state text not null default 'running',     -- running | paused | finished
  created_by uuid not null references auth.users,
  created_at timestamptz default now()
);

create table public.shortcuts (
  account_id uuid not null references auth.users on delete cascade,
  child_id uuid not null references public.children on delete cascade,
  items jsonb not null default '["feed","sleep","diaper","pump"]',
  primary key (account_id, child_id)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children on delete cascade,
  owner_id uuid not null references auth.users,
  type text not null,
  fixed_time time,
  interval_minutes int,
  enabled boolean default true,
  snoozed_until timestamptz,
  next_fire_at timestamptz
);

-- Helper functions (security definer so RLS policies can use them without recursion)
create or replace function public.is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships
    where child_id = cid and account_id = auth.uid() and revoked_at is null);
$$;

create or replace function public.can_write(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships
    where child_id = cid and account_id = auth.uid() and revoked_at is null
      and role in ('admin','caregiver'));
$$;

create or replace function public.is_admin(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships
    where child_id = cid and account_id = auth.uid() and revoked_at is null and role = 'admin');
$$;

-- Atomic child creation: child + admin membership + default shortcuts in one transaction
create or replace function public.create_child(
  p_name text, p_birth_date date, p_unit unit_system, p_photo_path text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  insert into children (name, birth_date, unit_system, photo_path, created_by)
  values (trim(p_name), p_birth_date, p_unit, p_photo_path, auth.uid())
  returning id into cid;
  insert into memberships (account_id, child_id, role) values (auth.uid(), cid, 'admin');
  insert into shortcuts (account_id, child_id) values (auth.uid(), cid);
  update profiles set last_child_id = cid where id = auth.uid();
  return cid;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table children enable row level security;
alter table memberships enable row level security;
alter table events enable row level security;
alter table timer_sessions enable row level security;
alter table shortcuts enable row level security;
alter table reminders enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "members read child" on children for select using (is_member(id));
create policy "admins update child" on children for update using (is_admin(id));

create policy "read own or admin memberships" on memberships for select
  using (account_id = auth.uid() or is_admin(child_id));
create policy "admin manages memberships" on memberships for update using (is_admin(child_id));

create policy "members read events" on events for select using (is_member(child_id));
create policy "writers insert events" on events for insert
  with check (can_write(child_id) and creator_id = auth.uid());
create policy "writers update events" on events for update using (can_write(child_id));
-- no DELETE policy: deletes are soft (deleted_at) so sync tombstones work

create policy "members read timers" on timer_sessions for select using (is_member(child_id));
create policy "writers manage timers" on timer_sessions for all
  using (can_write(child_id)) with check (can_write(child_id));

create policy "own shortcuts" on shortcuts for all
  using (account_id = auth.uid() and is_member(child_id))
  with check (account_id = auth.uid() and is_member(child_id));

create policy "members read reminders" on reminders for select using (is_member(child_id));
create policy "writers manage reminders" on reminders for all
  using (can_write(child_id)) with check (can_write(child_id));

-- Private storage bucket for child photos (path: <child_id>/<file>)
insert into storage.buckets (id, name, public) values ('child-media', 'child-media', false)
  on conflict do nothing;
create policy "members read media" on storage.objects for select
  using (bucket_id = 'child-media' and is_member(((storage.foldername(name))[1])::uuid));
create policy "writers upload media" on storage.objects for insert
  with check (bucket_id = 'child-media' and can_write(((storage.foldername(name))[1])::uuid));
