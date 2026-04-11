-- Stores onboarding goal ids on public.profiles.goals (JSON array of strings), same pattern as level.
-- Run in Supabase SQL Editor or: supabase db push

alter table public.profiles
  add column if not exists goals jsonb not null default '[]'::jsonb;

comment on column public.profiles.goals is
  'Onboarding selections, e.g. ["technique","fitness"]. Matches app goal ids.';

create or replace function public.set_user_profile_goals(p_goals jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_goals jsonb := coalesce(p_goals, '[]'::jsonb);
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if jsonb_typeof(v_goals) <> 'array' then
    raise exception 'Goals must be a JSON array';
  end if;

  if jsonb_array_length(v_goals) < 1 then
    raise exception 'At least one goal is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_goals) as g(goal)
    where jsonb_typeof(g.goal) <> 'string'
  ) then
    raise exception 'Each goal must be a string id';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(v_goals) as t(goal)
    where t.goal not in (
      'technique',
      'fitness',
      'competition',
      'social',
      'speed',
      'fun'
    )
  ) then
    raise exception 'Invalid goal id';
  end if;

  insert into public.profiles (id, goals, updated_at)
  values (uid, v_goals, now())
  on conflict (id) do update set
    goals = excluded.goals,
    updated_at = now();
end;
$$;

revoke all on function public.set_user_profile_goals(jsonb) from public;
grant execute on function public.set_user_profile_goals(jsonb) to authenticated;

notify pgrst, 'reload schema';
