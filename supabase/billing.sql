-- Billing: Stripe subscription status and the free screenshot allowance.
-- Signed-in users can read their own row but never change it; only the
-- server (using the Supabase secret key) writes here.
begin;

create table if not exists public.billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  subscription_id text,
  status text,                         -- Stripe status: trialing, active, past_due, canceled, ...
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  had_trial boolean not null default false,
  free_extractions_used integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.billing enable row level security;
revoke all on public.billing from public, anon, authenticated;
grant select on public.billing to authenticated;

drop policy if exists "Read own billing" on public.billing;
create policy "Read own billing" on public.billing
  for select to authenticated using ((select auth.uid()) = user_id);

-- Uses one free extraction if any are left. Returns true when allowed.
create or replace function public.use_free_extraction(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  insert into public.billing (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.billing
    set free_extractions_used = free_extractions_used + 1, updated_at = now()
    where user_id = p_user and free_extractions_used < p_limit
    returning true into allowed;
  return coalesce(allowed, false);
end;
$$;

-- Gives a free extraction back when the extraction itself failed.
create or replace function public.refund_free_extraction(p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.billing
    set free_extractions_used = greatest(free_extractions_used - 1, 0), updated_at = now()
    where user_id = p_user;
$$;

revoke all on function public.use_free_extraction(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_free_extraction(uuid) from public, anon, authenticated;
grant execute on function public.use_free_extraction(uuid, integer) to service_role;
grant execute on function public.refund_free_extraction(uuid) to service_role;

commit;
