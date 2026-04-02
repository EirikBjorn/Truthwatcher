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
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dev_project_subscriptions (
  id bigint generated always as identity primary key,
  project_slug text not null references public.dev_writing_progress (project_slug) on delete cascade,
  endpoint text not null,
  notifications_enabled boolean not null default true,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_slug, endpoint)
);

alter table public.dev_writing_progress enable row level security;
alter table public.dev_push_subscriptions enable row level security;
alter table public.dev_project_subscriptions enable row level security;

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

drop policy if exists "public can manage dev project subscriptions" on public.dev_project_subscriptions;
create policy "public can manage dev project subscriptions"
on public.dev_project_subscriptions
for all
to anon, authenticated
using (true)
with check (endpoint = subscription ->> 'endpoint');
