create table if not exists public.tournament_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.tournament_state enable row level security;

drop policy if exists "public can read tournament state" on public.tournament_state;
create policy "public can read tournament state"
on public.tournament_state
for select
using (true);

