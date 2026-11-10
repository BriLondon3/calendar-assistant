begin;

create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token_encrypted text not null
);

alter table public.google_calendar_connections enable row level security;
revoke all on public.google_calendar_connections from anon, authenticated;
grant select, insert, update, delete on public.google_calendar_connections to authenticated;

drop policy if exists "Read own calendar connection" on public.google_calendar_connections;
create policy "Read own calendar connection" on public.google_calendar_connections
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Save own calendar connection" on public.google_calendar_connections;
create policy "Save own calendar connection" on public.google_calendar_connections
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Update own calendar connection" on public.google_calendar_connections;
create policy "Update own calendar connection" on public.google_calendar_connections
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Remove own calendar connection" on public.google_calendar_connections;
create policy "Remove own calendar connection" on public.google_calendar_connections
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
