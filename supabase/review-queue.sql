begin;

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint text not null,
  event jsonb not null,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

alter table public.review_events enable row level security;
revoke all on public.review_events from public, anon, authenticated;
grant select, insert, update, delete on public.review_events to authenticated;
drop policy if exists "Manage own review events" on public.review_events;
create policy "Manage own review events" on public.review_events
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
