-- One-time search-cycle passes.
--
-- A pass is a single purchase that grants a fixed number of audio narrations.
-- Credits never expire, because a job search pauses and resumes. Lecture text
-- stays free; only stored narration is paid.
--
-- Row-level security means a user can read their own purchases, but only the
-- Stripe webhook (using the service-role key) can create one. Credits are
-- consumed and refunded through SECURITY DEFINER functions so two concurrent
-- requests cannot both spend the same last credit.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_total integer not null default 0,
  currency text not null default 'usd',
  credits_granted integer not null default 1,
  credits_remaining integer not null default 0 check (credits_remaining >= 0),
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_created_at_idx
  on public.purchases (user_id, created_at desc);

create index if not exists purchases_open_credits_idx
  on public.purchases (user_id, created_at)
  where credits_remaining > 0;

alter table public.purchases enable row level security;

revoke all privileges on table public.purchases from anon;
grant select on table public.purchases to authenticated;

drop policy if exists "Users can read their own purchases" on public.purchases;
create policy "Users can read their own purchases"
  on public.purchases
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Spend one credit from the oldest pass that still has one.
-- Returns the purchase id that was charged, or NULL when nothing is available.
create or replace function public.consume_audio_credit()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  charged_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  with picked as (
    select p.id
    from public.purchases p
    where p.user_id = auth.uid()
      and p.status = 'paid'
      and p.credits_remaining > 0
    order by p.created_at asc
    limit 1
    for update skip locked
  )
  update public.purchases p
    set credits_remaining = p.credits_remaining - 1
    from picked
    where p.id = picked.id
    returning p.id into charged_id;

  return charged_id;
end;
$$;

-- Give a credit back when narration fails after it was charged, so a provider
-- outage never costs the user a pass.
create or replace function public.refund_audio_credit(p_purchase_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  if auth.uid() is null then
    return -1;
  end if;

  update public.purchases
    set credits_remaining = credits_remaining + 1
    where id = p_purchase_id
      and user_id = auth.uid()
      and status = 'paid'
    returning credits_remaining into remaining;

  return coalesce(remaining, -1);
end;
$$;

revoke all on function public.consume_audio_credit() from public;
revoke all on function public.refund_audio_credit(uuid) from public;
grant execute on function public.consume_audio_credit() to authenticated;
grant execute on function public.refund_audio_credit(uuid) to authenticated;
