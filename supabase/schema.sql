-- Shared schema for the single Supabase database used by both:
-- - production tables (no prefix)
-- - dev tables (`dev_` prefix)

create table if not exists public.writing_progress (
  project_slug text primary key,
  project text not null,
  progress integer not null check (progress between 0 and 100),
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.writing_progress
add column if not exists is_visible boolean not null default true;

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid references auth.users (id) on delete set null,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions
add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists push_subscriptions_user_id_idx
on public.push_subscriptions (user_id);

create table if not exists public.project_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  project_slug text not null references public.writing_progress (project_slug) on delete cascade,
  endpoint text,
  notifications_enabled boolean not null default true,
  subscription jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_slug),
  unique (project_slug, endpoint)
);

alter table public.project_subscriptions
add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.project_subscriptions
alter column endpoint drop not null;

alter table public.project_subscriptions
alter column subscription drop not null;

with ranked_project_subscriptions as (
  select
    project_subscriptions.id,
    row_number() over (
      partition by coalesce(project_subscriptions.user_id, push_subscriptions.user_id), project_subscriptions.project_slug
      order by project_subscriptions.updated_at desc, project_subscriptions.created_at desc, project_subscriptions.id desc
    ) as duplicate_rank
  from public.project_subscriptions as project_subscriptions
  left join public.push_subscriptions as push_subscriptions
    on push_subscriptions.endpoint = project_subscriptions.endpoint
  where coalesce(project_subscriptions.user_id, push_subscriptions.user_id) is not null
)
delete from public.project_subscriptions as project_subscriptions
using ranked_project_subscriptions
where
  project_subscriptions.id = ranked_project_subscriptions.id and
  ranked_project_subscriptions.duplicate_rank > 1;

update public.project_subscriptions as project_subscriptions
set user_id = push_subscriptions.user_id
from public.push_subscriptions as push_subscriptions
where
  project_subscriptions.user_id is null and
  project_subscriptions.endpoint = push_subscriptions.endpoint and
  push_subscriptions.user_id is not null;

create index if not exists project_subscriptions_user_id_idx
on public.project_subscriptions (user_id);

create unique index if not exists project_subscriptions_user_id_project_slug_idx
on public.project_subscriptions (user_id, project_slug)
where user_id is not null;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  activity_notifications_enabled boolean not null default false,
  last_activity_notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists activity_notifications_enabled boolean not null default false;

alter table public.profiles
add column if not exists last_activity_notification_sent_at timestamptz;

create table if not exists public.currently_reading_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null,
  engagement_type text not null default 'reading',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, engagement_type)
);

alter table public.currently_reading_items
add column if not exists engagement_type text;

update public.currently_reading_items
set engagement_type = 'reading'
where engagement_type is null;

alter table public.currently_reading_items
alter column engagement_type set default 'reading';

alter table public.currently_reading_items
alter column engagement_type set not null;

alter table public.currently_reading_items
drop constraint if exists currently_reading_items_engagement_type_check;

alter table public.currently_reading_items
add constraint currently_reading_items_engagement_type_check
check (engagement_type in ('reading', 'listening'));

alter table public.currently_reading_items
drop constraint if exists currently_reading_items_user_id_key;

alter table public.currently_reading_items
drop constraint if exists currently_reading_items_user_id_work_id_key;

with ranked_currently_reading_items as (
  select
    id,
    row_number() over (
      partition by user_id, engagement_type
      order by started_at desc, updated_at desc, id desc
    ) as duplicate_rank
  from public.currently_reading_items
)
delete from public.currently_reading_items as currently_reading_items
using ranked_currently_reading_items
where
  currently_reading_items.id = ranked_currently_reading_items.id and
  ranked_currently_reading_items.duplicate_rank > 1;

create index if not exists currently_reading_items_started_at_idx
on public.currently_reading_items (started_at desc);

drop index if exists currently_reading_items_user_id_idx;

create index if not exists currently_reading_items_user_id_idx
on public.currently_reading_items (user_id);

create unique index if not exists currently_reading_items_user_id_engagement_type_idx
on public.currently_reading_items (user_id, engagement_type);

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null,
  activity_type text not null check (activity_type in ('reading', 'listening', 'finished')),
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.activity_events
drop constraint if exists activity_events_activity_type_check;

alter table public.activity_events
add constraint activity_events_activity_type_check
check (activity_type in ('reading', 'listening', 'finished'));

create index if not exists activity_events_processed_at_idx
on public.activity_events (processed_at, occurred_at desc);

create table if not exists public.reading_checklist_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_id)
);

create index if not exists reading_checklist_items_work_id_idx
on public.reading_checklist_items (work_id);

alter table public.writing_progress enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.project_subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.currently_reading_items enable row level security;
alter table public.activity_events enable row level security;
alter table public.reading_checklist_items enable row level security;

drop policy if exists "public can read writing progress" on public.writing_progress;
create policy "public can read writing progress"
on public.writing_progress
for select
to anon, authenticated
using (true);

drop policy if exists "public can manage push subscriptions" on public.push_subscriptions;
create policy "public can manage push subscriptions"
on public.push_subscriptions
for all
to anon, authenticated
using (true)
with check (endpoint = subscription ->> 'endpoint');

drop policy if exists "users can manage project subscriptions" on public.project_subscriptions;
drop policy if exists "public can manage project subscriptions" on public.project_subscriptions;
create policy "users can manage project subscriptions"
on public.project_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "users can manage their profile" on public.profiles;
create policy "users can manage their profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "authenticated users can read currently reading items" on public.currently_reading_items;
create policy "authenticated users can read currently reading items"
on public.currently_reading_items
for select
to authenticated
using (true);

drop policy if exists "users can manage their currently reading items" on public.currently_reading_items;
create policy "users can manage their currently reading items"
on public.currently_reading_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "authenticated users can read activity events" on public.activity_events;
create policy "authenticated users can read activity events"
on public.activity_events
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read reading checklist items" on public.reading_checklist_items;
create policy "authenticated users can read reading checklist items"
on public.reading_checklist_items
for select
to authenticated
using (completed = true);

drop policy if exists "users can manage their reading checklist items" on public.reading_checklist_items;
create policy "users can manage their reading checklist items"
on public.reading_checklist_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.log_currently_reading_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_events (actor_user_id, work_id, activity_type, occurred_at)
  values (new.user_id, new.work_id, new.engagement_type, coalesce(new.started_at, now()));

  return new;
end;
$$;

drop trigger if exists currently_reading_activity_event_trigger on public.currently_reading_items;
create trigger currently_reading_activity_event_trigger
after insert on public.currently_reading_items
for each row
execute function public.log_currently_reading_activity_event();

create or replace function public.log_reading_finished_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed and (tg_op = 'INSERT' or old.completed is distinct from new.completed) then
    insert into public.activity_events (actor_user_id, work_id, activity_type, occurred_at)
    values (new.user_id, new.work_id, 'finished', coalesce(new.updated_at, now()));
  end if;

  return new;
end;
$$;

drop trigger if exists reading_finished_activity_event_trigger on public.reading_checklist_items;
create trigger reading_finished_activity_event_trigger
after insert or update of completed on public.reading_checklist_items
for each row
execute function public.log_reading_finished_activity_event();

create table if not exists public.dev_writing_progress (
  project_slug text primary key,
  project text not null,
  progress integer not null check (progress between 0 and 100),
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.dev_writing_progress
add column if not exists is_visible boolean not null default true;

create table if not exists public.dev_push_subscriptions (
  endpoint text primary key,
  user_id uuid references auth.users (id) on delete set null,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dev_push_subscriptions
add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists dev_push_subscriptions_user_id_idx
on public.dev_push_subscriptions (user_id);

create table if not exists public.dev_project_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  project_slug text not null references public.dev_writing_progress (project_slug) on delete cascade,
  endpoint text,
  notifications_enabled boolean not null default true,
  subscription jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_slug),
  unique (project_slug, endpoint)
);

alter table public.dev_project_subscriptions
add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.dev_project_subscriptions
alter column endpoint drop not null;

alter table public.dev_project_subscriptions
alter column subscription drop not null;

with ranked_dev_project_subscriptions as (
  select
    project_subscriptions.id,
    row_number() over (
      partition by coalesce(project_subscriptions.user_id, push_subscriptions.user_id), project_subscriptions.project_slug
      order by project_subscriptions.updated_at desc, project_subscriptions.created_at desc, project_subscriptions.id desc
    ) as duplicate_rank
  from public.dev_project_subscriptions as project_subscriptions
  left join public.dev_push_subscriptions as push_subscriptions
    on push_subscriptions.endpoint = project_subscriptions.endpoint
  where coalesce(project_subscriptions.user_id, push_subscriptions.user_id) is not null
)
delete from public.dev_project_subscriptions as project_subscriptions
using ranked_dev_project_subscriptions
where
  project_subscriptions.id = ranked_dev_project_subscriptions.id and
  ranked_dev_project_subscriptions.duplicate_rank > 1;

update public.dev_project_subscriptions as project_subscriptions
set user_id = push_subscriptions.user_id
from public.dev_push_subscriptions as push_subscriptions
where
  project_subscriptions.user_id is null and
  project_subscriptions.endpoint = push_subscriptions.endpoint and
  push_subscriptions.user_id is not null;

create index if not exists dev_project_subscriptions_user_id_idx
on public.dev_project_subscriptions (user_id);

create unique index if not exists dev_project_subscriptions_user_id_project_slug_idx
on public.dev_project_subscriptions (user_id, project_slug)
where user_id is not null;

create table if not exists public.dev_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  activity_notifications_enabled boolean not null default false,
  last_activity_notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dev_profiles
add column if not exists activity_notifications_enabled boolean not null default false;

alter table public.dev_profiles
add column if not exists last_activity_notification_sent_at timestamptz;

create table if not exists public.dev_currently_reading_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null,
  engagement_type text not null default 'reading',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, engagement_type)
);

alter table public.dev_currently_reading_items
add column if not exists engagement_type text;

update public.dev_currently_reading_items
set engagement_type = 'reading'
where engagement_type is null;

alter table public.dev_currently_reading_items
alter column engagement_type set default 'reading';

alter table public.dev_currently_reading_items
alter column engagement_type set not null;

alter table public.dev_currently_reading_items
drop constraint if exists dev_currently_reading_items_engagement_type_check;

alter table public.dev_currently_reading_items
add constraint dev_currently_reading_items_engagement_type_check
check (engagement_type in ('reading', 'listening'));

alter table public.dev_currently_reading_items
drop constraint if exists dev_currently_reading_items_user_id_key;

alter table public.dev_currently_reading_items
drop constraint if exists dev_currently_reading_items_user_id_work_id_key;

with ranked_dev_currently_reading_items as (
  select
    id,
    row_number() over (
      partition by user_id, engagement_type
      order by started_at desc, updated_at desc, id desc
    ) as duplicate_rank
  from public.dev_currently_reading_items
)
delete from public.dev_currently_reading_items as dev_currently_reading_items
using ranked_dev_currently_reading_items
where
  dev_currently_reading_items.id = ranked_dev_currently_reading_items.id and
  ranked_dev_currently_reading_items.duplicate_rank > 1;

create index if not exists dev_currently_reading_items_started_at_idx
on public.dev_currently_reading_items (started_at desc);

drop index if exists dev_currently_reading_items_user_id_idx;

create index if not exists dev_currently_reading_items_user_id_idx
on public.dev_currently_reading_items (user_id);

create unique index if not exists dev_currently_reading_items_user_id_engagement_type_idx
on public.dev_currently_reading_items (user_id, engagement_type);

create table if not exists public.dev_activity_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null,
  activity_type text not null check (activity_type in ('reading', 'listening', 'finished')),
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.dev_activity_events
drop constraint if exists dev_activity_events_activity_type_check;

alter table public.dev_activity_events
add constraint dev_activity_events_activity_type_check
check (activity_type in ('reading', 'listening', 'finished'));

create index if not exists dev_activity_events_processed_at_idx
on public.dev_activity_events (processed_at, occurred_at desc);

create table if not exists public.dev_reading_checklist_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_id)
);

create index if not exists dev_reading_checklist_items_work_id_idx
on public.dev_reading_checklist_items (work_id);

alter table public.dev_writing_progress enable row level security;
alter table public.dev_push_subscriptions enable row level security;
alter table public.dev_project_subscriptions enable row level security;
alter table public.dev_profiles enable row level security;
alter table public.dev_currently_reading_items enable row level security;
alter table public.dev_activity_events enable row level security;
alter table public.dev_reading_checklist_items enable row level security;

drop policy if exists "public can read dev writing progress" on public.dev_writing_progress;
create policy "public can read dev writing progress"
on public.dev_writing_progress
for select
to anon, authenticated
using (true);

drop policy if exists "public can manage dev push subscriptions" on public.dev_push_subscriptions;
create policy "public can manage dev push subscriptions"
on public.dev_push_subscriptions
for all
to anon, authenticated
using (true)
with check (endpoint = subscription ->> 'endpoint');

drop policy if exists "users can manage dev project subscriptions" on public.dev_project_subscriptions;
drop policy if exists "public can manage dev project subscriptions" on public.dev_project_subscriptions;
create policy "users can manage dev project subscriptions"
on public.dev_project_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "authenticated users can read dev profiles" on public.dev_profiles;
create policy "authenticated users can read dev profiles"
on public.dev_profiles
for select
to authenticated
using (true);

drop policy if exists "users can manage their dev profile" on public.dev_profiles;
create policy "users can manage their dev profile"
on public.dev_profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "authenticated users can read dev currently reading items" on public.dev_currently_reading_items;
create policy "authenticated users can read dev currently reading items"
on public.dev_currently_reading_items
for select
to authenticated
using (true);

drop policy if exists "users can manage their dev currently reading items" on public.dev_currently_reading_items;
create policy "users can manage their dev currently reading items"
on public.dev_currently_reading_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "authenticated users can read dev activity events" on public.dev_activity_events;
create policy "authenticated users can read dev activity events"
on public.dev_activity_events
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read dev reading checklist items" on public.dev_reading_checklist_items;
create policy "authenticated users can read dev reading checklist items"
on public.dev_reading_checklist_items
for select
to authenticated
using (completed = true);

drop policy if exists "users can manage their dev reading checklist items" on public.dev_reading_checklist_items;
create policy "users can manage their dev reading checklist items"
on public.dev_reading_checklist_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.log_dev_currently_reading_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dev_activity_events (actor_user_id, work_id, activity_type, occurred_at)
  values (new.user_id, new.work_id, new.engagement_type, coalesce(new.started_at, now()));

  return new;
end;
$$;

drop trigger if exists dev_currently_reading_activity_event_trigger on public.dev_currently_reading_items;
create trigger dev_currently_reading_activity_event_trigger
after insert on public.dev_currently_reading_items
for each row
execute function public.log_dev_currently_reading_activity_event();

create or replace function public.log_dev_reading_finished_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed and (tg_op = 'INSERT' or old.completed is distinct from new.completed) then
    insert into public.dev_activity_events (actor_user_id, work_id, activity_type, occurred_at)
    values (new.user_id, new.work_id, 'finished', coalesce(new.updated_at, now()));
  end if;

  return new;
end;
$$;

drop trigger if exists dev_reading_finished_activity_event_trigger on public.dev_reading_checklist_items;
create trigger dev_reading_finished_activity_event_trigger
after insert or update of completed on public.dev_reading_checklist_items
for each row
execute function public.log_dev_reading_finished_activity_event();
