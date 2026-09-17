-- Keep payment posting compatible with separation of duties.
-- A payment creator cannot post the same payment; APPROVER provides the distinct authorized role.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'APPROVER'
  and p.code = 'payment.post'
  and not exists (
    select 1
    from public.role_permissions rp
    where rp.role_id = r.id
      and rp.permission_id = p.id
  );
