import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function money(value: number) {
  return new Intl.NumberFormat("es-PR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "FX").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default async function DashboardPage() {
  const { userId, claims } = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id", userId).maybeSingle(),
    supabase.from("organization_memberships").select("organization_id,membership_role").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle(),
  ]);

  const organizationId = membership?.organization_id;
  let fiscalYear: { id: string; code: string; name: string } | null = null;

  if (organizationId) {
    const { data } = await supabase
      .from("fiscal_years")
      .select("id,code,name")
      .eq("organization_id", organizationId)
      .eq("status", "OPEN")
      .order("starts_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    fiscalYear = data;
  }

  let revisedBudget = 0;
  let available = 0;
  let committed = 0;
  let obligated = 0;
  let expended = 0;
  let requisitionsPending = 0;
  let ordersOpen = 0;
  let vouchersPending = 0;
  let paymentsPosted = 0;
  let matchExceptions = 0;
  let integrityReview = 0;
  let activity: Array<{ id: string; event_type: string; entity_type: string; created_at: string }> = [];

  if (organizationId && fiscalYear?.id) {
    const [budgetLines, balances, reqCount, poCount, voucherCount, paymentCount, audit, pipeline, integrity] = await Promise.all([
      supabase.from("budget_lines").select("revised_budget").eq("organization_id", organizationId).eq("fiscal_year_id", fiscalYear.id).eq("is_active", true),
      supabase.from("v_budget_balances").select("available,committed,obligated,expended").eq("organization_id", organizationId).eq("fiscal_year_id", fiscalYear.id),
      supabase.from("requisitions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
      supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["CREATED", "ISSUED", "PARTIALLY_RECEIVED"]),
      supabase.from("vouchers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("status", ["DRAFT", "SUBMITTED"]),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "POSTED"),
      supabase.from("audit_events").select("id,event_type,entity_type,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(4),
      supabase.from("v_document_pipeline_summary").select("match_exceptions").eq("organization_id", organizationId).maybeSingle(),
      supabase.from("v_financial_integrity").select("integrity_status").eq("organization_id", organizationId).eq("fiscal_year_id", fiscalYear.id),
    ]);

    revisedBudget = (budgetLines.data || []).reduce((sum, row) => sum + Number(row.revised_budget || 0), 0);
    for (const row of balances.data || []) {
      available += Number(row.available || 0);
      committed += Number(row.committed || 0);
      obligated += Number(row.obligated || 0);
      expended += Number(row.expended || 0);
    }
    requisitionsPending = reqCount.count || 0;
    ordersOpen = poCount.count || 0;
    vouchersPending = voucherCount.count || 0;
    paymentsPosted = paymentCount.count || 0;
    activity = audit.data || [];
    matchExceptions = Number(pipeline.data?.match_exceptions || 0);
    integrityReview = (integrity.data || []).filter((row: any) => row.integrity_status !== "PASS").length;
  }

  const used = revisedBudget > 0 ? Math.max(0, Math.min(100, ((revisedBudget - available) / revisedBudget) * 100)) : 0;
  const displayName = profile?.full_name || String(claims.email || "Usuario FYNEXO");

  return (
    <AppShell
      title="Financial Command Center"
      subtitle={`Bienvenido, ${displayName}. Visión ejecutiva con datos reales de FYNEXO.`}
      fiscalYearLabel={fiscalYear ? `FY ${fiscalYear.code}` : "Sin año fiscal abierto"}
      userInitials={initials(profile?.full_name, profile?.email || String(claims.email || ""))}
    >
      <section className="executive-strip">
        <div><span>Operación financiera</span><strong>{fiscalYear?.name || "Sin periodo activo"}</strong></div>
        <div><span>Uso presupuestario</span><strong>{used.toFixed(1)}%</strong></div>
        <div><span>Disponibilidad</span><strong>{revisedBudget ? ((available / revisedBudget) * 100).toFixed(1) : "0.0"}%</strong></div>
      </section>

      <section className="kpi-grid" aria-label="Indicadores financieros">
        <KpiCard label="Presupuesto vigente" value={money(revisedBudget)} detail="Suma de partidas activas" />
        <KpiCard label="Disponible" value={money(available)} detail={`${revisedBudget ? ((available / revisedBudget) * 100).toFixed(1) : "0.0"}% restante`} tone="success" />
        <KpiCard label="Comprometido + obligado" value={money(committed + obligated)} detail={`Comprometido ${money(committed)} · Obligado ${money(obligated)}`} />
        <KpiCard label="Ejecutado" value={money(expended)} detail={`${revisedBudget ? ((expended / revisedBudget) * 100).toFixed(1) : "0.0"}% pagado`} />
      </section>

      <section className="dashboard-grid">
        <article className="panel span-2">
          <div className="panel-header">
            <div><p className="eyebrow">Ejecución real</p><h2>{fiscalYear?.name || "Presupuesto"}</h2></div>
            <strong>{used.toFixed(1)}%</strong>
          </div>
          <div className="progress" aria-label={`Ejecución presupuestaria ${used.toFixed(1)}%`}><span style={{ width: `${used}%` }} /></div>
          <div className="mini-stats">
            <span>Vigente <b>{money(revisedBudget)}</b></span>
            <span>Comprometido <b>{money(committed)}</b></span>
            <span>Obligado <b>{money(obligated)}</b></span>
            <span>Disponible <b>{money(available)}</b></span>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Mi trabajo</p><h2>Requiere atención</h2>
          <ul className="task-list">
            <li><span>Requisiciones en proceso</span><b>{requisitionsPending}</b></li>
            <li><span>Órdenes abiertas</span><b>{ordersOpen}</b></li>
            <li><span>Comprobantes pendientes</span><b>{vouchersPending}</b></li>
            <li><span>Pagos contabilizados</span><b>{paymentsPosted}</b></li>
          </ul>
        </article>

        <article className="panel span-2">
          <p className="eyebrow">Auditoría</p><h2>Últimos movimientos</h2>
          {activity.length ? (
            <div className="timeline">
              {activity.map((item) => (
                <div key={item.id}>
                  <i />
                  <span><b>{item.event_type}</b> · {item.entity_type}</span>
                  <time>{new Intl.DateTimeFormat("es-PR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at))}</time>
                </div>
              ))}
            </div>
          ) : <p className="muted">Aún no hay movimientos auditables. Los eventos aparecerán aquí al comenzar las operaciones.</p>}
        </article>

        <article className="panel alert-panel">
          <p className="eyebrow">Estado</p><h2>Controles financieros</h2>
          <p><b>Integridad del ledger:</b> {integrityReview ? `${integrityReview} partida(s) requieren revisión` : "sin discrepancias detectadas"}.</p>
          <p><b>Three-Way Match:</b> {matchExceptions ? `${matchExceptions} excepción(es) pendientes` : "sin excepciones detectadas"}.</p>
          <p><b>Control de acceso:</b> las acciones críticas se validan en servidor y base de datos.</p>
        </article>
      </section>
    </AppShell>
  );
}
