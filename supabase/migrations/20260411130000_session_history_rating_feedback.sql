
alter table public.session_history
  add column if not exists rate integer;

alter table public.session_history
  add column if not exists comments text;

alter table public.session_history
  drop constraint if exists session_history_rate_check;

alter table public.session_history
  add constraint session_history_rate_check
  check (rate is null or (rate >= 1 and rate <= 3));

notify pgrst, 'reload schema';
