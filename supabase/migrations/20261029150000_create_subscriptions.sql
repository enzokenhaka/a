create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan_id text not null check (plan_id in ('iniciante', 'crescimento', 'premium')),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  renewal_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

grant select on table public.subscriptions to authenticated;

create policy "Users can view their own subscription"
  on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.cancel_my_subscription()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  subscription_cancelled boolean;
begin
  update public.subscriptions
  set status = 'cancelled',
      updated_at = now()
  where user_id = (select auth.uid())
    and status = 'active';

  subscription_cancelled := found;
  return subscription_cancelled;
end;
$$;

revoke all on function public.cancel_my_subscription() from public;
grant execute on function public.cancel_my_subscription() to authenticated;
