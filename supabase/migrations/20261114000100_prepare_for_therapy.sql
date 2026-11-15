-- User-owned records for the Prepare for Therapy experience.

create table if not exists public.therapy_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('chat_message', 'journal_entry')),
  source_id text not null,
  content text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create table if not exists public.sleep_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  hours numeric not null check (hours >= 0 and hours <= 24),
  quality integer not null check (quality between 1 and 5),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create table if not exists public.therapy_next_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  skipped boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists therapy_bookmarks_user_created_idx on public.therapy_bookmarks (user_id, created_at desc);
create index if not exists sleep_checkins_user_date_idx on public.sleep_checkins (user_id, checkin_date desc);
create index if not exists therapy_next_steps_user_order_idx on public.therapy_next_steps (user_id, sort_order);

alter table public.therapy_bookmarks enable row level security;
alter table public.sleep_checkins enable row level security;
alter table public.therapy_next_steps enable row level security;

grant select, insert, update, delete on
  public.therapy_bookmarks,
  public.sleep_checkins,
  public.therapy_next_steps
to authenticated;

drop policy if exists "users manage own therapy bookmarks" on public.therapy_bookmarks;
create policy "users manage own therapy bookmarks" on public.therapy_bookmarks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own sleep checkins" on public.sleep_checkins;
create policy "users manage own sleep checkins" on public.sleep_checkins
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own therapy next steps" on public.therapy_next_steps;
create policy "users manage own therapy next steps" on public.therapy_next_steps
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
