"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";

const nav = [
  ["Dashboard", "/dashboard", "⌂"],
  ["Presupuesto", "/budget", "$"],
  ["Requisiciones", "/requisitions", "R"],
  ["Órdenes", "/orders", "O"],
  ["Recepción", "/receiving", "✓"],
  ["Facturas", "/invoices", "F"],
  ["Comprobantes", "/vouchers", "C"],
  ["Pagos", "/payments", "P"],
  ["Proveedores", "/vendors", "V"],
  ["Informes", "/reports", "↗"],
  ["Auditoría", "/audit", "A"],
  ["Administración", "/administration", "⚙"],
] as const;

export function AppShell({
  children, title, subtitle, fiscalYearLabel = "FY 2026–2027", userInitials = "FX",
}: {
  children: React.ReactNode; title: string; subtitle?: string; fiscalYearLabel?: string; userInitials?: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRole() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { data } = await supabase.from("user_roles").select("roles(code)").eq("user_id", userId);
        const admin = (data || []).some((row: any) => {
          const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
          return role?.code === "ADMIN";
        });
        if (active) setIsAdmin(admin);
      } finally { if (active) setRoleLoaded(true); }
    }
    loadRole();
    return () => { active = false; };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const visibleNav = useMemo(
    () => nav.filter(([, href]) => href !== "/administration" || (roleLoaded && isAdmin)),
    [isAdmin, roleLoaded]
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="sidebar-head">
          <Link href="/dashboard" className="sidebar-brand" aria-label="FYNEXO Dashboard">
            <div className="brand-mark small">FX</div>
            <div><strong>FYNEXO</strong><span>Financial Operations</span></div>
          </Link>
          <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="fynexo-navigation" onClick={() => setMenuOpen(v => !v)}>
            <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span><span className="sr-only">{menuOpen ? "Cerrar menú" : "Abrir menú"}</span>
          </button>
        </div>
        <p className="nav-section-label">OPERACIONES</p>
        <nav id="fynexo-navigation" aria-label="Navegación principal">
          {visibleNav.map(([label, href, icon]) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user"><div className="avatar compact">{userInitials}</div><div><b>Cuenta activa</b><small>{fiscalYearLabel}</small></div></div>
          <form action={signOut}><button className="ghost-button" type="submit">Cerrar sesión</button></form>
        </div>
      </aside>
      {menuOpen ? <button className="menu-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} /> : null}
      <div className="content-shell">
        <header className="topbar">
          <div className="page-title"><p className="eyebrow">{fiscalYearLabel}</p><h1>{title}</h1>{subtitle ? <p className="muted">{subtitle}</p> : null}</div>
          <div className="top-actions"><div className="system-status"><i aria-hidden="true" />Sistema activo</div><div className="avatar" aria-label="Perfil de usuario">{userInitials}</div></div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
