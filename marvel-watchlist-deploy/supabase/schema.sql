create table if not exists public.watchlist_state (
  user_id uuid not null,
  title_id text not null,
  watched boolean not null default false,
  schedule_date date,
  schedule_time time,
  updated_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

alter table public.watchlist_state enable row level security;

drop policy if exists "demo public read" on public.watchlist_state;
drop policy if exists "demo public insert" on public.watchlist_state;
drop policy if exists "demo public update" on public.watchlist_state;
drop policy if exists "demo public delete" on public.watchlist_state;

-- Demo/project policy: the app uses a random UUID stored only in the visitor's browser.
create policy "demo public read" on public.watchlist_state for select to anon using (true);
create policy "demo public insert" on public.watchlist_state for insert to anon with check (true);
create policy "demo public update" on public.watchlist_state for update to anon using (true) with check (true);
create policy "demo public delete" on public.watchlist_state for delete to anon using (true);
