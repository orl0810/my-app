-- Persists onboarding level choice on public.profiles.level (RPC avoids PostgREST column cache issues).
-- Apply in Supabase SQL Editor or: supabase db push

create or replace function public.set_user_profile_level(p_level text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_level text := nullif(trim(p_level), '');
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_level is null then
    raise exception 'Level is required';
  end if;

  insert into public.profiles (id, level, updated_at)
  values (uid, v_level, now())
  on conflict (id) do update set
    level = excluded.level,
    updated_at = now();
end;
$$;

revoke all on function public.set_user_profile_level(text) from public;
grant execute on function public.set_user_profile_level(text) to authenticated;

notify pgrst, 'reload schema';
