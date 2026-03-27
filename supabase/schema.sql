create table if not exists public.writing_progress (
  project_slug text primary key,
  project text not null,
  progress integer not null check (progress between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_subscriptions (
  id bigint generated always as identity primary key,
  project_slug text not null references public.writing_progress (project_slug) on delete cascade,
  endpoint text not null,
  notifications_enabled boolean not null default true,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_slug, endpoint)
);

alter table public.writing_progress enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.project_subscriptions enable row level security;

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

drop policy if exists "public can manage project subscriptions" on public.project_subscriptions;
create policy "public can manage project subscriptions"
on public.project_subscriptions
for all
to anon, authenticated
using (true)
with check (endpoint = subscription ->> 'endpoint');
