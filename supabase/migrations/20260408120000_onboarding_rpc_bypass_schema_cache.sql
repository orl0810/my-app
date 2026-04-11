-- PostgREST can return PGRST204 ("column not in schema cache") for new columns even
-- when they exist in Postgres. These RPCs run in the database and avoid REST column validation.
-- Run this entire file in Supabase → SQL Editor (or apply via supabase db push).
--
-- IMPORTANT: New functions are invisible to the REST API until PostgREST reloads its schema.
-- The NOTIFY at the bottom triggers that reload. If the app still says "function not in schema
-- cache", run only the NOTIFY line again, wait ~30s, or pause/resume the project (Dashboard).

create or replace function public.get_user_onboarding_completed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.onboarding_completed
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.complete_user_onboarding()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, onboarding_completed, updated_at)
  values (uid, true, now())
  on conflict (id) do update set
    onboarding_completed = true,
    updated_at = now();
end;
$$;

revoke all on function public.get_user_onboarding_completed() from public;
revoke all on function public.complete_user_onboarding() from public;

grant execute on function public.get_user_onboarding_completed() to authenticated;
grant execute on function public.complete_user_onboarding() to authenticated;

-- Refresh PostgREST so /rest/v1/rpc/* can see the functions above.
notify pgrst, 'reload schema';
