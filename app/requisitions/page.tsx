import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function money(value: number) {
  return new Intl.NumberFormat("es-PR", { style: "currency", currency: "USD" }).format(value || 0);
}

export default async function Page() {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  const [{ data: fy }, { data: requisitions }] = await Promise.all([
    organizationId ? supabase.from("fiscal_years").select("id,code").eq("organization_id", organizationId).eq("status", "OPEN").order("starts_on", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null } as any),
    organizationId ? supabase.from("requisitions").select("id,requisition_no,title,status,total_amount,created_at,vendors(legal_name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] } as any),
  ]);

  return (
    <AppShell title="FYNEXO Procure" subtitle="Requisiciones, validación presupuestaria y aprobaciones." fiscalYearLabel={fy ? `FY ${fy.code}` : "Sin año fiscal abierto"}>
      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">Procurement</p><h2>Requisiciones</h2><p className="muted">Cada aprobación genera el compromiso correspondiente en el budget ledger.</p></div><Link href="/requisitions/new" className="primary-button">+ Nueva requisición</Link></div>
        {(requisitions || []).length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Número</th><th>Título</th><th>Proveedor</th><th>Estado</th><th className="num">Total</th></tr></thead><tbody>{(requisitions || []).map((r: any) => <tr key={r.id}><td><Link href={`/requisitions/${r.id}`}><b>{r.requisition_no || "BORRADOR"}</b></Link></td><td>{r.title}</td><td>{r.vendors?.legal_name || "Por determinar"}</td><td><span className="status-pill">{r.status}</span></td><td className="num">{money(Number(r.total_amount || 0))}</td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon">R</div><h3>No hay requisiciones todavía</h3><p className="muted">Cree un borrador y añada artículos contra partidas con saldo disponible.</p></div>}
      </section>
    </AppShell>
  );
}
