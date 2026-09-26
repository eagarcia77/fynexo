import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createVendor, updateVendor } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const [{ data: vendors }, { data: canCreate }, { data: canUpdate }] = await Promise.all([
    organizationId
    ? supabase.from("vendors").select("id,vendor_no,legal_name,tax_id_masked,email,phone,status,created_at").eq("organization_id", organizationId).order("legal_name")
    : Promise.resolve({ data: [] as any[] } as any),
    organizationId ? supabase.rpc("current_user_has_permission", { p_org: organizationId, p_permission: "vendor.create" }) : Promise.resolve({ data: false } as any),
    organizationId ? supabase.rpc("current_user_has_permission", { p_org: organizationId, p_permission: "vendor.update" }) : Promise.resolve({ data: false } as any),
  ]);

  return (
    <AppShell title="Vendor 360°" subtitle="Proveedores, estado, contacto y trazabilidad de compras.">
      {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
      {params.message ? <div className="success-box" role="status">{params.message}</div> : null}
      <div className="form-grid">
        <section className="panel">
          <p className="eyebrow">Alta de proveedor</p><h2>Nuevo proveedor</h2>
          {canCreate ? <form action={createVendor} className="entity-form">
            <label>Nombre legal *<input name="legalName" required /></label>
            <label>Número de proveedor<input name="vendorNo" placeholder="Opcional; FYNEXO puede generarlo" /></label>
            <label>Correo electrónico<input name="email" type="email" /></label>
            <label>Teléfono<input name="phone" /></label>
            <label>ID fiscal enmascarado<input name="taxIdMasked" placeholder="Ej. ***-**-1234" /></label>
            <button className="primary-button" type="submit">Crear proveedor</button>
          </form> : <div className="notice-box">Su acceso a proveedores es de solo lectura.</div>}
        </section>
        <section className="panel span-2">
          <p className="eyebrow">Directorio</p><h2>Proveedores registrados</h2>
          {(vendors || []).length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Número</th><th>Proveedor</th><th>Contacto</th><th>Estado</th><th>Actualizar</th></tr></thead><tbody>{(vendors || []).map((v: any) => <tr key={v.id}><td><b>{v.vendor_no || "—"}</b></td><td>{v.legal_name}</td><td><small>{v.email || "Sin correo"}<br />{v.phone || "Sin teléfono"}</small></td><td><span className="status-pill">{v.status}</span></td><td>{canUpdate ? <details><summary>Editar</summary><form action={updateVendor} className="entity-form compact-form top-gap"><input type="hidden" name="vendorId" value={v.id}/><label>Nombre legal<input name="legalName" defaultValue={v.legal_name} required/></label><label>Correo<input name="email" type="email" defaultValue={v.email || ""}/></label><label>Teléfono<input name="phone" defaultValue={v.phone || ""}/></label><label>ID fiscal<input name="taxIdMasked" defaultValue={v.tax_id_masked || ""}/></label><label>Estado<select name="status" defaultValue={v.status}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="SUSPENDED">Suspendido</option></select></label><button className="secondary-button">Guardar</button></form></details> : <span className="tiny">Solo lectura</span>}</td></tr>)}</tbody></table></div> : <p className="muted">Aún no hay proveedores registrados.</p>}
        </section>
      </div>
    </AppShell>
  );
}
