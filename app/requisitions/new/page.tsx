import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createRequisition } from "../actions";

export default async function NewRequisitionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const [{ data: fy }, { data: vendors }] = await Promise.all([
    organizationId ? supabase.from("fiscal_years").select("code").eq("organization_id", organizationId).eq("status", "OPEN").order("starts_on", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null } as any),
    organizationId ? supabase.from("vendors").select("id,vendor_no,name").eq("organization_id", organizationId).eq("is_active", true).order("name") : Promise.resolve({ data: [] } as any),
  ]);

  return (
    <AppShell title="Nueva requisición" subtitle="Inicie una solicitud de compra y luego añada partidas e ítems con validación presupuestaria." fiscalYearLabel={fy ? `FY ${fy.code}` : "Sin año fiscal abierto"}>
      <section className="panel narrow-panel">
        <div className="panel-header"><div><p className="eyebrow">FYNEXO Procure</p><h2>Información general</h2></div><Link href="/requisitions" className="command-button">Volver</Link></div>
        {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
        <form action={createRequisition} className="entity-form">
          <label>Título *<input name="title" required maxLength={180} /></label>
          <label>Justificación<textarea name="justification" rows={5} /></label>
          <label>Proveedor
            <select name="vendorId"><option value="">Por determinar</option>{(vendors || []).map((v: any) => <option key={v.id} value={v.id}>{v.vendor_no ? `${v.vendor_no} — ` : ""}{v.name}</option>)}</select>
          </label>
          <div className="form-actions"><button className="primary-button" type="submit" disabled={!fy}>Crear borrador</button></div>
        </form>
      </section>
    </AppShell>
  );
}
