-- Read-only permission check for authenticated UI authorization hints.
-- Server-side financial RPCs remain authoritative.
create or replace function public.current_user_has_permission(p_org uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, app, auth
as $$
  select app.user_has_permission(p_org, p_permission);
$$;

revoke all on function public.current_user_has_permission(uuid,text) from public, anon;
grant execute on function public.current_user_has_permission(uuid,text) to authenticated;
