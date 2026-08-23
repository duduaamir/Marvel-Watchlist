-- ============================================================
-- MARVEL WATCHLIST
-- SUPABASE DATABASE + AUTHENTICATED USER SECURITY
-- ============================================================


-- ------------------------------------------------------------
-- TABLE
-- ------------------------------------------------------------

create table if not exists public.watchlist_state (

  user_id uuid not null,

  title_id text not null,

  watched boolean not null default false,

  schedule_date date,

  schedule_time time,

  updated_at timestamptz not null default now(),

  primary key (user_id, title_id)

);


-- ------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.watchlist_state
enable row level security;


-- ------------------------------------------------------------
-- REMOVE OLD DEMO POLICIES
-- ------------------------------------------------------------

drop policy if exists
"demo public read"
on public.watchlist_state;


drop policy if exists
"demo public insert"
on public.watchlist_state;


drop policy if exists
"demo public update"
on public.watchlist_state;


drop policy if exists
"demo public delete"
on public.watchlist_state;


-- ------------------------------------------------------------
-- REMOVE OLD AUTH POLICIES IF THEY ALREADY EXIST
-- ------------------------------------------------------------

drop policy if exists
"Users can view their own watchlist"
on public.watchlist_state;


drop policy if exists
"Users can add to their own watchlist"
on public.watchlist_state;


drop policy if exists
"Users can update their own watchlist"
on public.watchlist_state;


drop policy if exists
"Users can delete their own watchlist"
on public.watchlist_state;


-- ------------------------------------------------------------
-- SELECT
--
-- A logged-in user can only see rows where:
--
-- auth.uid() = user_id
-- ------------------------------------------------------------

create policy
"Users can view their own watchlist"

on public.watchlist_state

for select

to authenticated

using (

  auth.uid() = user_id

);


-- ------------------------------------------------------------
-- INSERT
--
-- A user can only create rows belonging to themselves.
-- ------------------------------------------------------------

create policy
"Users can add to their own watchlist"

on public.watchlist_state

for insert

to authenticated

with check (

  auth.uid() = user_id

);


-- ------------------------------------------------------------
-- UPDATE
--
-- A user can only update their own rows.
-- ------------------------------------------------------------

create policy
"Users can update their own watchlist"

on public.watchlist_state

for update

to authenticated

using (

  auth.uid() = user_id

)

with check (

  auth.uid() = user_id

);


-- ------------------------------------------------------------
-- DELETE
--
-- A user can only delete their own rows.
-- ------------------------------------------------------------

create policy
"Users can delete their own watchlist"

on public.watchlist_state

for delete

to authenticated

using (

  auth.uid() = user_id

);


-- ------------------------------------------------------------
-- OPTIONAL:
-- Automatically update updated_at whenever a row changes.
-- ------------------------------------------------------------

create or replace function
public.update_updated_at_column()

returns trigger

language plpgsql

as $$

begin

  new.updated_at = now();

  return new;

end;

$$;


drop trigger if exists
update_watchlist_state_updated_at

on public.watchlist_state;


create trigger
update_watchlist_state_updated_at

before update

on public.watchlist_state

for each row

execute function
public.update_updated_at_column();
