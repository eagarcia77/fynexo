import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function money(value: number) {
  return new Intl.NumberFormat("es-PR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

export default async function Page() {
  const { userId } = await requireUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

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

  let lines: any[] = [];
  let balances: any[] = [];

  if (organizationId && fiscalYear?.id) {
    const [lineResult, balanceResult] = await Promise.all([
      supabase
        .from("budget_lines")
        .select("id,original_budget,revised_budget,is_active, departments(name), funds(code,name), programs(code,name), projects(code,name), cost_centers(code,name), accounts(code,name)")
        .eq("organization_id", organizationId)
        .eq("fiscal_year_id", fiscalYear.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("v_budget_balances")
        .select("budget_line_id,available,committed,obligated,expended")
        .eq("organization_id", organizationId)
        .eq("fiscal_year_id", fiscalYear.id),
    ]);
    lines = lineResult.data || [];
    balances = balanceResult.data || [];
  }

  const balanceMap = new Map(balances.map((row) => [row.budget_line_id, row]));
  const totalOriginal = lines.reduce((sum, row) => sum + Number(row.original_budget || 0), 0);
  const totalRevised = lines.reduce((sum, row) => sum + Number(row.revised_budget || 0), 0);
  const totalAvailable = balances.reduce((sum, row) => sum + Number(row.available || 0), 0);
  const totalExpended = balances.reduce((sum, row) => sum + Number(row.expended || 0), 0);

  return (
    <AppShell
      title="FYNEXO Budget"
      subtitle="Partidas, fondos, cuentas y disponibilidad presupuestaria en tiempo real."
      fiscalYearLabel={fiscalYear ? `FY ${fiscalYear.code}` : "Sin año fiscal abierto"}
    >
      <section className="kpi-grid" aria-label="Resumen presupuestario">
        <KpiCard label="Presupuesto original" value={money(totalOriginal)} detail={`${lines.length} partidas`} />
        <KpiCard label="Presupuesto vigente" value={money(totalRevised)} detail="Incluye ajustes presupuestarios" />
        <KpiCard label="Disponible" value={money(totalAvailable)} detail="Saldo utilizable" tone="success" />
        <KpiCard label="Ejecutado" value={money(totalExpended)} detail="Gasto contabilizado" />
      </section>

      <section className="panel budget-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Control presupuestario</p>
            <h2>{fiscalYear?.name || "Partidas"}</h2>
            <p className="muted">Los saldos provienen de la vista financiera basada en el budget ledger.</p>
          </div>
          <button className="primary-button" type="button" disabled title="Se habilitará en la siguiente fase de captura">+ Nueva partida</button>
        </div>

        {lines.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Departamento</th>
                  <th>Fondo</th>
                  <th>Programa / Proyecto</th>
                  <th className="num">Vigente</th>
                  <th className="num">Comprometido</th>
                  <th className="num">Obligado</th>
                  <th className="num">Ejecutado</th>
                  <th className="num">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const bal = balanceMap.get(line.id) || {};
                  return (
                    <tr key={line.id}>
                      <td><b>{line.accounts?.code || "—"}</b><small>{line.accounts?.name || "Sin cuenta"}</small></td>
                      <td>{line.departments?.name || "—"}</td>
                      <td>{line.funds?.code || "—"}</td>
                      <td>{line.programs?.code || line.projects?.code || "—"}</td>
                      <td className="num">{money(Number(line.revised_budget || 0))}</td>
                      <td className="num">{money(Number(bal.committed || 0))}</td>
                      <td className="num">{money(Number(bal.obligated || 0))}</td>
                      <td className="num">{money(Number(bal.expended || 0))}</td>
                      <td className="num"><b>{money(Number(bal.available || 0))}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">$</div>
            <h3>Aún no hay partidas presupuestarias</h3>
            <p className="muted">La estructura financiera está activa. La siguiente fase habilitará la creación de partidas y el registro del presupuesto original mediante transacciones protegidas.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
