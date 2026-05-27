-- profiles: one row per auth user
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  points      int  not null default 0,
  streak_days int  not null default 0,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
-- Fix #5: add WITH CHECK so users cannot reassign their profile to a different id
create policy "profiles_update_own" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Fix #2: auto-create a profiles row when a new auth user is created
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- slots: 30 pillows in the room
create table slots (
  id     uuid primary key default gen_random_uuid(),
  number int  not null unique,
  status text not null default 'available'
    check (status in ('available', 'occupied'))
);

alter table slots enable row level security;
create policy "slots_select_auth" on slots for select to authenticated using (true);

-- Fix #3: index to avoid full-table scans on (status, number)
create index slots_status_number on slots (status, number);

-- sessions: each check-in creates one row
create table sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id),
  slot_id        uuid not null references slots(id),
  status         text not null default 'active'
    check (status in ('active', 'closed')),
  checked_in_at  timestamptz default now(),
  checked_out_at timestamptz
);

alter table sessions enable row level security;
create policy "sessions_select_own" on sessions for select using (auth.uid() = user_id);

-- Fix #1: prevent double-booking — only one active session per slot at a time
create unique index sessions_one_active_per_slot on sessions (slot_id) where (status = 'active');

-- Fix #3: index to avoid full-table scans on (user_id, status)
create index sessions_user_status on sessions (user_id, status);

-- point_events: ledger of all point changes
create table point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id),
  session_id uuid references sessions(id),
  delta      int  not null,
  -- Fix #4: reason is NOT NULL — must always be specified when inserting a point event
  reason     text not null check (reason in ('successful_return', 'non_compliance')),
  created_at timestamptz default now()
);

alter table point_events enable row level security;
create policy "point_events_select_own" on point_events for select using (auth.uid() = user_id);

-- Fix #6: keep profiles.points in sync with point_events ledger
create or replace function sync_profile_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
    set points = points + new.delta
    where id = new.user_id;
  return new;
end;
$$;

create trigger on_point_event_insert
  after insert on point_events
  for each row execute procedure sync_profile_points();

-- Enable realtime for live slot + session updates
alter publication supabase_realtime add table slots;
alter publication supabase_realtime add table sessions;
