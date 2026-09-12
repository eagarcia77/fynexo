import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createInvitation, revokeInvitation, setUserRole } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; invite?: string; email?: string; expires?: string }> }) {
  const params = await searchParams;
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;

  const [rolesResult, membersResult, profilesResult, userRolesResult, invitesResult] = await Promise.all([
    organizationId ? supabase.from("roles").select("id,code,name,is_system").eq("organization_id", organizationId).order("name") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("organization_memberships").select("user_id,membership_role,is_active,created_at").eq("organization_id", organizationId).order("created_at") : Promise.resolve({ data: [] } as any),
    supabase.from("profiles").select("id,full_name,email"),
    organizationId ? supabase.from("user_roles").select("user_id,role_id,roles(name,code)").eq("organization_id", organizationId) : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("user_invitations").select("id,email,expires_at,accepted_at,revoked_at,created_at,roles(name,code)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] } as any),
  ]);

  const roles = rolesResult.data || [];
  const members = membersResult.data || [];
  const invites = invitesResult.data || [];
  const profileMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
  const userRoleMap = new Map((userRolesResult.data || []).map((ur: any) => [ur.user_id, ur]));
  const invitePath = params.invite ? `/join/${params.invite}` : null;
  const inviteUrl = invitePath ? `https://fynexo.onrender.com${invitePath}` : null;

  return (
    <AppShell title="FYNEXO Control Center" subtitle="Usuarios, roles, invitaciones y controles de acceso.">
      {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
      {params.message ? <div className="success-box" role="status">{params.message}</div> : null}
      {inviteUrl ? <div className="success-box invite-success" role="status">
        <b>Invitación creada para {params.email}.</b>
        <span>Comparta este enlace una sola vez:</span>
        <a className="invite-link" href={inviteUrl}>{inviteUrl}</a>
        <div className="form-actions"><a className="primary-button" href={inviteUrl}>Abrir invitación</a></div>
        {params.expires ? <small>Expira: {new Intl.DateTimeFormat("es-PR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(params.expires))}</small> : null}
      </div> : null}

      <div className="form-grid">
        <section className="panel">
          <p className="eyebrow">Acceso</p><h2>Invitar usuario</h2>
          <p className="muted">La persona crea su propia contraseña mediante Supabase Auth. La invitación solo define organización y rol.</p>
          <form action={createInvitation} className="entity-form">
            <label>Correo electrónico *<input type="email" name="email" required /></label>
            <label>Rol *<select name="roleId" required><option value="">Seleccione...</option>{roles.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}</select></label>
            <label>Expiración<select name="expiresHours" defaultValue="72"><option value="24">24 horas</option><option value="72">72 horas</option><option value="168">7 días</option></select></label>
            <button className="primary-button">Crear invitación</button>
          </form>
        </section>

        <section className="panel span-2">
          <p className="eyebrow">Usuarios</p><h2>Membresías</h2>
          {members.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Administrar</th></tr></thead><tbody>{members.map((m: any) => { const profile: any = profileMap.get(m.user_id); const ur: any = userRoleMap.get(m.user_id); const role: any = Array.isArray(ur?.roles) ? ur.roles[0] : ur?.roles; return <tr key={m.user_id}><td><b>{profile?.full_name || "Usuario"}</b><small>{profile?.email || m.user_id}</small></td><td>{role?.name || m.membership_role}</td><td><span className="status-pill">{m.is_active ? "ACTIVO" : "INACTIVO"}</span></td><td><form action={setUserRole} className="inline-form"><input type="hidden" name="userId" value={m.user_id}/><select name="roleId" defaultValue={ur?.role_id || ""}>{roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}</select><select name="active" defaultValue={String(m.is_active)}><option value="true">Activo</option><option value="false">Inactivo</option></select><button className="secondary-button">Guardar</button></form></td></tr>; })}</tbody></table></div> : <p className="muted">No hay usuarios vinculados.</p>}
        </section>
      </div>

      <section className="panel top-gap">
        <p className="eyebrow">Invitaciones</p><h2>Historial</h2>
        {invites.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Correo</th><th>Rol</th><th>Expira</th><th>Estado</th><th></th></tr></thead><tbody>{invites.map((i: any) => { const role = Array.isArray(i.roles) ? i.roles[0] : i.roles; const state = i.accepted_at ? "ACEPTADA" : i.revoked_at ? "REVOCADA" : new Date(i.expires_at) < new Date() ? "EXPIRADA" : "PENDIENTE"; return <tr key={i.id}><td>{i.email}</td><td>{role?.name || "—"}</td><td>{new Intl.DateTimeFormat("es-PR", { dateStyle: "short", timeStyle: "short" }).format(new Date(i.expires_at))}</td><td><span className="status-pill">{state}</span></td><td>{state === "PENDIENTE" ? <form action={revokeInvitation}><input type="hidden" name="invitationId" value={i.id}/><button className="command-button">Revocar</button></form> : null}</td></tr>; })}</tbody></table></div> : <p className="muted">No hay invitaciones.</p>}
      </section>
    </AppShell>
  );
}
