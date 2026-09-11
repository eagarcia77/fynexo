import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  await requireUser();
  return (
    <AppShell title="Financial Command Center" subtitle="Visión ejecutiva del presupuesto, compras y obligaciones.">
      <section className="kpi-grid" aria-label="Indicadores financieros">
        <KpiCard label="Presupuesto vigente" value="$4.85M" detail="100% autorizado" />
        <KpiCard label="Disponible" value="$1.36M" detail="28.1% restante" tone="success" />
        <KpiCard label="Comprometido" value="$610K" detail="12.6% del presupuesto" />
        <KpiCard label="Ejecutado" value="$2.87M" detail="59.2% pagado" />
      </section>

      <section className="dashboard-grid">
        <article className="panel span-2">
          <div className="panel-header"><div><p className="eyebrow">Ejecución</p><h2>Presupuesto FY 2026–2027</h2></div><strong>71.9%</strong></div>
          <div className="progress" aria-label="Ejecución presupuestaria 71.9%"><span style={{ width: "71.9%" }} /></div>
          <div className="mini-stats"><span>Original <b>$4.62M</b></span><span>Ajustes <b>+$230K</b></span><span>Disponible <b>$1.36M</b></span></div>
        </article>

        <article className="panel">
          <p className="eyebrow">Mi trabajo</p><h2>Requiere atención</h2>
          <ul className="task-list">
            <li><span>Requisiciones por aprobar</span><b>7</b></li>
            <li><span>Órdenes sin recibir</span><b>4</b></li>
            <li><span>Comprobantes pendientes</span><b>6</b></li>
            <li><span>Excepciones abiertas</span><b>2</b></li>
          </ul>
        </article>

        <article className="panel span-2">
          <p className="eyebrow">Actividad</p><h2>Últimos movimientos</h2>
          <div className="timeline">
            <div><i /> <span><b>REQ-2027-000142</b> aprobada</span><time>09:42</time></div>
            <div><i /> <span><b>PO-2027-000088</b> emitida</span><time>09:39</time></div>
            <div><i /> <span>Partida <b>5200</b> ajustada</span><time>09:35</time></div>
            <div><i /> <span><b>VCH-2027-000052</b> sometido</span><time>09:29</time></div>
          </div>
        </article>

        <article className="panel alert-panel">
          <p className="eyebrow">Control</p><h2>Alertas inteligentes</h2>
          <p><b>Partida 5200</b> alcanzó 91% de utilización.</p>
          <p><b>INV-00922</b> presenta diferencia de $850 contra la orden.</p>
          <p><b>3 órdenes</b> superan 30 días abiertas.</p>
        </article>
      </section>
    </AppShell>
  );
}
