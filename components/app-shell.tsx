"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";

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
  ["Auditoría", "/audit"],
  ["Administración", "/administration"],
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  fiscalYearLabel = "FY 2026–2027",
  userInitials = "FX",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  fiscalYearLabel?: string;
  userInitials?: string;
}) {
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

        const { data } = await supabase
          .from("user_roles")
          .select("roles(code)")
          .eq("user_id", userId);

        const admin = (data || []).some((row: any) => {
          const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
          return role?.code === "ADMIN";
        });

        if (active) setIsAdmin(admin);
      } finally {
        if (active) setRoleLoaded(true);
      }
    }

    loadRole();
    return () => { active = false; };
  }, []);

  const visibleNav = useMemo(
    () => nav.filter(([, href]) => href !== "/administration" || (roleLoaded && isAdmin)),
    [isAdmin, roleLoaded]
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <div className="brand-mark small">FX</div>
            <div><strong>FYNEXO</strong><span>Financial Intelligence</span></div>
          </div>
          <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="fynexo-navigation" onClick={() => setMenuOpen((value) => !value)}>
            <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span><span className="sr-only">{menuOpen ? "Cerrar menú" : "Abrir menú"}</span>
          </button>
        </div>
        <div className="mobile-nav-label">Menú principal</div>
        <nav id="fynexo-navigation" aria-label="Navegación principal">
          {visibleNav.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
        </nav>
        <form action={signOut}><button className="ghost-button" type="submit">Cerrar sesión</button></form>
      </aside>
      {menuOpen ? <button className="menu-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} /> : null}
      <div className="content-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{fiscalYearLabel}</p>
            <h1>{title}</h1>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <div className="top-actions">
            <button className="command-button" type="button">⌘K Buscar o crear</button>
            <div className="avatar" aria-label="Perfil de usuario">{userInitials}</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
