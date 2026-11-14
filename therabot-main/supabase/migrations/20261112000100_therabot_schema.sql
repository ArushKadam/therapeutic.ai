-- TheraBot tables used by src/services/supabase.ts.
-- Run in the Supabase SQL Editor as a project owner.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  mood text,
  ai_analysis text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null,
  reflection text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null,
  intensity integer not null check (intensity between 1 and 10),
  created_at timestamptz not null default now()
);

create table if not exists public.mood_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('journal', 'voice', 'chat')),
  source_id text not null,
  primary_mood text not null,
  secondary_mood text,
  intensity numeric not null check (intensity between 1 and 10),
  confidence numeric not null check (confidence between 0 and 1),
  reasoning text not null default '',
  key_emotions text[] not null default '{}',
  raw_content text not null default '',
  duration numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_mood_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  primary_mood text not null,
  secondary_mood text,
  average_intensity numeric not null default 5,
  overall_confidence numeric not null default 0.1,
  reasoning text not null default '',
  key_emotions text[] not null default '{}',
  analysis_count integer not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  target_area text not null default '',
  confidence numeric not null default 0.75,
  week_of date not null,
  insights jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null default 'mindfulness',
  duration integer not null default 10,
  difficulty text not null default 'easy',
  completed boolean not null default false,
  due_date timestamptz not null default now(),
  instructions jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx on public.conversations (user_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);
create index if not exists mood_analyses_user_created_idx on public.mood_analyses (user_id, created_at desc);
create index if not exists weekly_plans_user_week_idx on public.weekly_plans (user_id, week_of desc);
create index if not exists exercises_user_due_idx on public.exercises (user_id, due_date);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.journal_entries enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.mood_entries enable row level security;
alter table public.mood_analyses enable row level security;
alter table public.daily_mood_summaries enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.exercises enable row level security;

grant select, insert, update, delete on
  public.conversations,
  public.messages,
  public.journal_entries,
  public.daily_checkins,
  public.mood_entries,
  public.mood_analyses,
  public.daily_mood_summaries,
  public.weekly_plans,
  public.exercises
to authenticated;

drop policy if exists "users manage own conversations" on public.conversations;
create policy "users manage own conversations" on public.conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users access messages in own conversations" on public.messages;
create policy "users access messages in own conversations" on public.messages
  for all to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));

drop policy if exists "users manage own journal entries" on public.journal_entries;
create policy "users manage own journal entries" on public.journal_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own daily checkins" on public.daily_checkins;
create policy "users manage own daily checkins" on public.daily_checkins
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own mood entries" on public.mood_entries;
create policy "users manage own mood entries" on public.mood_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own mood analyses" on public.mood_analyses;
create policy "users manage own mood analyses" on public.mood_analyses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own daily mood summaries" on public.daily_mood_summaries;
create policy "users manage own daily mood summaries" on public.daily_mood_summaries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own weekly plans" on public.weekly_plans;
create policy "users manage own weekly plans" on public.weekly_plans
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own exercises" on public.exercises;
create policy "users manage own exercises" on public.exercises
  for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.weekly_plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.weekly_plans p where p.id = plan_id and p.user_id = auth.uid()));

create or replace function public.create_plan_with_exercises(plan_data jsonb, exercises_data jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_plan public.weekly_plans;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.weekly_plans (user_id, title, description, target_area, confidence, week_of, insights)
  values (
    auth.uid(),
    coalesce(plan_data->>'title', 'Weekly wellness plan'),
    coalesce(plan_data->>'description', ''),
    coalesce(plan_data->>'target_area', ''),
    coalesce((plan_data->>'confidence')::numeric, 0.75),
    (plan_data->>'week_of')::date,
    coalesce(plan_data->'insights', '[]'::jsonb)
  ) returning * into created_plan;

  insert into public.exercises (plan_id, user_id, title, description, type, duration, difficulty, due_date, instructions, benefits)
  select
    created_plan.id,
    auth.uid(),
    coalesce(item->>'title', 'Wellness exercise'),
    coalesce(item->>'description', ''),
    coalesce(item->>'type', 'mindfulness'),
    coalesce((item->>'duration')::integer, 10),
    coalesce(item->>'difficulty', 'easy'),
    coalesce((item->>'due_date')::timestamptz, now()),
    coalesce(item->'instructions', '[]'::jsonb),
    coalesce(item->'benefits', '[]'::jsonb)
  from jsonb_array_elements(coalesce(exercises_data, '[]'::jsonb)) as exercise_item(item);

  return to_jsonb(created_plan) || jsonb_build_object(
    'exercises', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.due_date)
      from public.exercises e where e.plan_id = created_plan.id and e.user_id = auth.uid()
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.create_plan_with_exercises(jsonb, jsonb) from public;
grant execute on function public.create_plan_with_exercises(jsonb, jsonb) to authenticated;
