import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createBudgetDimension, createBudgetLine } from "../actions";

export default async function NewBudgetLinePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
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
  const [{ data: fy }, accounts, departments, funds, programs, projects, costCenters] = await Promise.all([
    organizationId ? supabase.from("fiscal_years").select("id,code,name").eq("organization_id", organizationId).eq("status", "OPEN").order("starts_on", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null } as any),
    organizationId ? supabase.from("accounts").select("id,code,name").eq("organization_id", organizationId).eq("is_active", true).order("code") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("departments").select("id,code,name").eq("organization_id", organizationId).eq("is_active", true).order("code") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("funds").select("id,code,name").eq("organization_id", organizationId).eq("is_active", true).order("code") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("programs").select("id,code,name").eq("organization_id", organizationId).eq("is_active", true).order("code") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("projects").select("id,code,name").eq("organization_id", organizationId).eq("is_active", true).order("code") : Promise.resolve({ data: [] } as any),
    organizationId ? supabase.from("cost_centers").select("id,code,name").eq("organization_id", organizationId).eq("is_active", true).order("code") : Promise.resolve({ data: [] } as any),
  ]);

  const opts = (rows: any[] | null) => rows || [];
  const hasAccount = opts(accounts.data).length > 0;

  return (
    <AppShell title="Nueva partida" subtitle="Cree la estructura y publique el presupuesto inicial en una transacción protegida." fiscalYearLabel={fy ? `FY ${fy.code}` : "Sin año fiscal abierto"}>
      <div className="form-grid">
        <section className="panel span-2">
          <div className="panel-header"><div><p className="eyebrow">FYNEXO Budget</p><h2>Partida presupuestaria</h2></div><Link href="/budget" className="command-button">Volver</Link></div>
          {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
          {params.message ? <div className="success-box" role="status">{params.message}</div> : null}
          {!hasAccount ? <div className="notice-box">Antes de crear una partida debe registrar al menos una cuenta en el catálogo de abajo.</div> : null}
          <form action={createBudgetLine} className="entity-form">
            <label>Cuenta *
              <select name="accountId" required disabled={!hasAccount}>
                <option value="">Seleccione...</option>
                {opts(accounts.data).map((row: any) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}
              </select>
            </label>
            <label>Presupuesto inicial *<input name="amount" type="number" min="0" step="0.01" required /></label>
            <label>Departamento<select name="departmentId"><option value="">No aplica</option>{opts(departments.data).map((row: any) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</select></label>
            <label>Fondo<select name="fundId"><option value="">No aplica</option>{opts(funds.data).map((row: any) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</select></label>
            <label>Programa<select name="programId"><option value="">No aplica</option>{opts(programs.data).map((row: any) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</select></label>
            <label>Proyecto<select name="projectId"><option value="">No aplica</option>{opts(projects.data).map((row: any) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</select></label>
            <label>Centro de costo<select name="costCenterId"><option value="">No aplica</option>{opts(costCenters.data).map((row: any) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</select></label>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={!hasAccount || !fy}>Crear partida y publicar presupuesto</button></div>
          </form>
        </section>

        <section className="panel">
          <p className="eyebrow">Catálogos</p><h2>Agregar dimensión</h2>
          <p className="muted">Registre únicamente códigos oficiales de su estructura financiera.</p>
          <form action={createBudgetDimension} className="entity-form compact-form">
            <label>Tipo<select name="kind" required><option value="ACCOUNT">Cuenta</option><option value="DEPARTMENT">Departamento</option><option value="FUND">Fondo</option><option value="PROGRAM">Programa</option><option value="PROJECT">Proyecto</option><option value="COST_CENTER">Centro de costo</option></select></label>
            <label>Código<input name="code" required /></label>
            <label>Nombre<input name="name" required /></label>
            <label>Tipo de cuenta<input name="accountType" placeholder="Opcional" /></label>
            <button className="secondary-button" type="submit">Agregar al catálogo</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
