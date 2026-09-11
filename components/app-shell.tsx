import Link from "next/link";
import { signOut } from "@/app/login/actions";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Presupuesto", "/budget"],
  ["Requisiciones", "/requisitions"],
  ["Órdenes", "/orders"],
  ["Recepción", "/receiving"],
  ["Facturas", "/invoices"],
  ["Comprobantes", "/vouchers"],
  ["Pagos", "/payments"],
  ["Proveedores", "/vendors"],
  ["Informes", "/reports"],
  ["Administración", "/administration"],
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">FX</div>
          <div><strong>FYNEXO</strong><span>Financial Intelligence</span></div>
        </div>
        <nav aria-label="Navegación principal">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <form action={signOut}><button className="ghost-button" type="submit">Cerrar sesión</button></form>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">FY 2026–2027</p>
            <h1>{title}</h1>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <div className="top-actions">
            <button className="command-button" type="button">⌘K Buscar o crear</button>
            <div className="avatar" aria-label="Perfil de usuario">EG</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
