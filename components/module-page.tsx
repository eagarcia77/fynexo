import { AppShell } from "./app-shell";

export function ModulePage({ title, description, actionLabel }: { title: string; description: string; actionLabel?: string }) {
  return (
    <AppShell title={title} subtitle={description}>
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">FYNEXO v1.0</p>
          <h2>{title}</h2>
          <p className="muted">Este módulo está conectado a la arquitectura transaccional, RBAC, RLS, auditoría y record locks definidos para FYNEXO.</p>
        </div>
        {actionLabel ? <button className="primary-button">{actionLabel}</button> : null}
      </section>
      <section className="panel empty-state">
        <div className="empty-icon">◇</div>
        <h3>Base del módulo preparada</h3>
        <p>La siguiente iteración conectará formularios, tablas y acciones reales con Supabase.</p>
      </section>
    </AppShell>
  );
}
