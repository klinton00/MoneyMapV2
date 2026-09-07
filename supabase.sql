-- MoneyTrack database schema for Supabase
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 80),
  category text not null default 'Other',
  date date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 300),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions"
on public.transactions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions"
on public.transactions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions"
on public.transactions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions"
on public.transactions for delete
using (auth.uid() = user_id);

create index if not exists transactions_user_date_idx
on public.transactions(user_id, date desc);

-- Optional: enable realtime if you later want multiple tabs/devices
-- to reflect changes instantly:
-- alter publication supabase_realtime add table public.transactions;
