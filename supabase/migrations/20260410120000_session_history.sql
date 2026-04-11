

create table if not exists public.session_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  session_title text not null,
  completed_at timestamptz not null default now(),
  difficulty text,
  duration_minutes integer
);

alter table public.session_history
  drop constraint if exists session_history_difficulty_check;

alter table public.session_history
  add constraint session_history_difficulty_check
  check (
    difficulty is null
    or difficulty in ('easy', 'good', 'hard')
  );

create index if not exists session_history_user_completed_at_idx
  on public.session_history (user_id, completed_at desc);

alter table public.session_history enable row level security;

drop policy if exists "session_history_select_own" on public.session_history;
create policy "session_history_select_own"
  on public.session_history
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "session_history_insert_own" on public.session_history;
create policy "session_history_insert_own"
  on public.session_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.session_history to authenticated;

notify pgrst, 'reload schema';
