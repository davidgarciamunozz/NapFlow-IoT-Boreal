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
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- slots: 30 pillows in the room
create table slots (
  id     uuid primary key default gen_random_uuid(),
  number int  not null unique,
  status text not null default 'available'
    check (status in ('available', 'occupied'))
);

alter table slots enable row level security;
create policy "slots_select_auth" on slots for select to authenticated using (true);

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

-- point_events: ledger of all point changes
create table point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id),
  session_id uuid references sessions(id),
  delta      int  not null,
  reason     text check (reason in ('successful_return', 'non_compliance')),
  created_at timestamptz default now()
);

alter table point_events enable row level security;
create policy "point_events_select_own" on point_events for select using (auth.uid() = user_id);

-- Enable realtime for live slot + session updates
alter publication supabase_realtime add table slots;
alter publication supabase_realtime add table sessions;
