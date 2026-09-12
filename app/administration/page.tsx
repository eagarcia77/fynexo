import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createInvitation, revokeInvitation, setUserRole, sendUserPasswordReset } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; invite?: string; email?: string; expires?: string }> }) {
  const params = await searchParams;
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;

  const [rolesResult, usersResult, invitesResult] = await Promise.all([
    organizationId ? supabase.from("roles").select("id,code,name,is_system").eq("organization_id", organizationId).order("name") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.rpc("admin_list_org_users", { p_org: organizationId }) : Promise.resolve({ data: [], error: null } as any),
    organizationId ? supabase.from("user_invitations").select("id,email,expires_at,accepted_at,revoked_at,created_at,roles(name,code)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] } as any),
  ]);
  const roles = rolesResult.data || []; const users = usersResult.data || []; const invites = invitesResult.data || [];
  const invitePath = params.invite ? `/join/${params.invite}` : null; const inviteUrl = invitePath ? `https://fynexo.onrender.com${invitePath}` : null;

  return <AppShell title="FYNEXO Control Center" subtitle="Usuarios, roles, contraseñas, invitaciones y controles de acceso.">
    {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}{params.message ? <div className="success-box" role="status">{params.message}</div> : null}
    {usersResult.error ? <div className="error-box" role="alert">Acceso administrativo requerido.</div> : null}
    {inviteUrl ? <div className="success-box invite-success" role="status"><b>Invitación creada para {params.email}.</b><span>Comparta este enlace una sola vez:</span><a className="invite-link" href={inviteUrl}>{inviteUrl}</a><div className="form-actions"><a className="primary-button" href={inviteUrl}>Abrir invitación</a></div>{params.expires ? <small>Expira: {new Intl.DateTimeFormat("es-PR", { dateStyle:"medium", timeStyle:"short" }).format(new Date(params.expires))}</small> : null}</div> : null}

    <div className="form-grid"><section className="panel"><p className="eyebrow">Acceso</p><h2>Invitar usuario</h2><p className="muted">La persona crea su propia contraseña mediante Supabase Auth. La invitación define organización y rol.</p><form action={createInvitation} className="entity-form"><label>Correo electrónico *<input type="email" name="email" required /></label><label>Rol *<select name="roleId" required><option value="">Seleccione...</option>{roles.map((r:any)=><option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}</select></label><label>Expiración<select name="expiresHours" defaultValue="72"><option value="24">24 horas</option><option value="72">72 horas</option><option value="168">7 días</option></select></label><button className="primary-button">Crear invitación</button></form></section>

    <section className="panel span-2"><p className="eyebrow">Administración de usuarios</p><h2>Usuarios y acceso</h2><p className="muted">El administrador puede ver usuarios, cambiar roles, activar o desactivar cuentas y enviar un enlace seguro para restablecer la contraseña. FYNEXO nunca muestra contraseñas existentes.</p>{users.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Administrar</th><th>Contraseña</th></tr></thead><tbody>{users.map((u:any)=><tr key={u.user_id}><td><b>{u.full_name||"Usuario"}</b><small>{u.email||u.user_id}</small></td><td>{u.role_name||u.membership_role}</td><td><span className="status-pill">{u.is_active?"ACTIVO":"INACTIVO"}</span></td><td><form action={setUserRole} className="inline-form"><input type="hidden" name="userId" value={u.user_id}/><select name="roleId" defaultValue={u.role_id||""}>{roles.map((r:any)=><option key={r.id} value={r.id}>{r.name}</option>)}</select><select name="active" defaultValue={String(u.is_active)}><option value="true">Activo</option><option value="false">Inactivo</option></select><button className="secondary-button">Guardar</button></form></td><td>{u.email?<form action={sendUserPasswordReset}><input type="hidden" name="userId" value={u.user_id}/><button className="command-button">Cambiar contraseña</button></form>:<span className="tiny">Sin correo</span>}</td></tr>)}</tbody></table></div>:<p className="muted">No hay usuarios vinculados.</p>}</section></div>

    <section className="panel top-gap"><p className="eyebrow">Invitaciones</p><h2>Historial</h2>{invites.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Correo</th><th>Rol</th><th>Expira</th><th>Estado</th><th></th></tr></thead><tbody>{invites.map((i:any)=>{const role=Array.isArray(i.roles)?i.roles[0]:i.roles;const state=i.accepted_at?"ACEPTADA":i.revoked_at?"REVOCADA":new Date(i.expires_at)<new Date()?"EXPIRADA":"PENDIENTE";return <tr key={i.id}><td>{i.email}</td><td>{role?.name||"—"}</td><td>{new Intl.DateTimeFormat("es-PR",{dateStyle:"short",timeStyle:"short"}).format(new Date(i.expires_at))}</td><td><span className="status-pill">{state}</span></td><td>{state==="PENDIENTE"?<form action={revokeInvitation}><input type="hidden" name="invitationId" value={i.id}/><button className="command-button">Revocar</button></form>:null}</td></tr>})}</tbody></table></div>:<p className="muted">No hay invitaciones.</p>}</section>
  </AppShell>;
}
