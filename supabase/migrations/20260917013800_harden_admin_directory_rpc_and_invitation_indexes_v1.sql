-- Harden the administrator directory RPC and cover invitation foreign keys.
-- The RPC performs its own ADMIN authorization check, but anonymous callers
-- must not be able to invoke a SECURITY DEFINER function.
revoke all on function public.admin_list_org_users(uuid) from public, anon;
grant execute on function public.admin_list_org_users(uuid) to authenticated;

create index if not exists idx_user_invitations_accepted_by
  on public.user_invitations(accepted_by);
create index if not exists idx_user_invitations_created_by
  on public.user_invitations(created_by);
create index if not exists idx_user_invitations_role_id
  on public.user_invitations(role_id);
