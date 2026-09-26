import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RecordLockGuard } from "@/components/record-lock-guard";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { addRequisitionItem, approveRequisition, submitRequisition } from "../actions";

function money(value: number) {
  return new Intl.NumberFormat("es-PR", { style: "currency", currency: "USD" }).format(value || 0);
}

export default async function RequisitionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const { id } = await params;
  const messages = await searchParams;
  const { userId } = await requireUser();
  const supabase = await createClient();

  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  const organizationId = membership?.organization_id;
  if (!organizationId) notFound();

  const { data: req } = await supabase
    .from("requisitions")
    .select("id,requisition_no,title,justification,status,total_amount,requester_id,fiscal_year_id,created_at,vendors(legal_name)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!req) notFound();

  const [{ data: fy }, { data: items }, { data: lines }, { data: balances }, { data: canApprovePermission }] = await Promise.all([
    supabase.from("fiscal_years").select("code,name").eq("id", req.fiscal_year_id).maybeSingle(),
    supabase.from("requisition_items").select("id,description,quantity,unit_price,line_total,budget_line_id,budget_lines(accounts(code,name),funds(code),departments(name))").eq("requisition_id", id).order("id"),
    supabase.from("budget_lines").select("id,accounts(code,name),funds(code),departments(name)").eq("organization_id", organizationId).eq("fiscal_year_id", req.fiscal_year_id).eq("is_active", true),
    supabase.from("v_budget_balances").select("budget_line_id,available").eq("organization_id", organizationId).eq("fiscal_year_id", req.fiscal_year_id),
    supabase.rpc("current_user_has_permission", { p_org: organizationId, p_permission: "requisition.approve" }),
  ]);

  const balanceMap = new Map((balances || []).map((b: any) => [b.budget_line_id, Number(b.available || 0)]));
  const editable = req.status === "DRAFT" && req.requester_id === userId;
  const canApprove = req.status === "SUBMITTED" && req.requester_id !== userId && Boolean(canApprovePermission);
  const hasItems = (items || []).length > 0;

  const editor = (
    <section className="panel">
      <p className="eyebrow">Agregar artículo</p><h2>Partida y detalle</h2>
      <form action={addRequisitionItem} className="entity-form">
        <input type="hidden" name="requisitionId" value={id} />
        <label>Partida presupuestaria *
          <select name="budgetLineId" required><option value="">Seleccione...</option>{(lines || []).map((line: any) => <option key={line.id} value={line.id}>{line.accounts?.code || "Sin cuenta"} — {line.accounts?.name || "Partida"} · Disponible {money(balanceMap.get(line.id) || 0)}</option>)}</select>
        </label>
        <label>Descripción *<input name="description" required /></label>
        <label>Cantidad *<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label>
        <label>Precio unitario *<input name="unitPrice" type="number" min="0" step="0.01" required /></label>
        <button className="secondary-button" type="submit">Agregar y validar presupuesto</button>
      </form>
    </section>
  );

  return (
    <AppShell title={req.requisition_no || "Requisición en borrador"} subtitle={req.title} fiscalYearLabel={fy ? `FY ${fy.code}` : "Año fiscal"}>
      <div className="panel-header page-heading"><div><p className="eyebrow">FYNEXO Procure</p><h2>{req.title}</h2><p className="muted">Estado: <b>{req.status}</b> · Total: <b>{money(Number(req.total_amount || 0))}</b></p></div><Link href="/requisitions" className="command-button">Volver</Link></div>
      {messages.error ? <div className="error-box" role="alert">{messages.error}</div> : null}
      {messages.message ? <div className="success-box" role="status">{messages.message}</div> : null}

      {editable && hasItems ? <section className="panel workflow-callout">
        <div><p className="eyebrow">Siguiente paso</p><h2>Someter requisición</h2><p className="muted">El borrador ya tiene artículos. Al someter, FYNEXO asignará el número oficial y la enviará al aprobador. El presupuesto todavía no se compromete hasta la aprobación.</p></div>
        <form action={submitRequisition}><input type="hidden" name="requisitionId" value={id} /><button className="primary-button" type="submit">Someter requisición</button></form>
      </section> : null}

      {req.status === "SUBMITTED" && !canApprove ? <section className="notice-box"><b>Pendiente de aprobación.</b> Esta requisición ya fue sometida y requiere acción de un usuario distinto con permiso de aprobación.</section> : null}

      {canApprove ? <section className="panel workflow-callout"><div><p className="eyebrow">Acción requerida</p><h2>Aprobar y registrar compromiso</h2><p className="muted">La separación de funciones está activa. Al aprobar, FYNEXO registrará el COMMITMENT en el budget ledger.</p></div><form action={approveRequisition} className="entity-form approval-inline"><input type="hidden" name="requisitionId" value={id} /><label>Comentarios<textarea name="comments" rows={3} /></label><button className="primary-button" type="submit">Aprobar y comprometer</button></form></section> : null}

      <div className="form-grid top-gap">
        <section className="panel span-2">
          <p className="eyebrow">Resumen</p><h2>Artículos</h2>
          {hasItems ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Cuenta</th><th>Descripción</th><th className="num">Cantidad</th><th className="num">Precio</th><th className="num">Total</th></tr></thead><tbody>{(items || []).map((item: any) => <tr key={item.id}><td><b>{item.budget_lines?.accounts?.code || "—"}</b><small>{item.budget_lines?.accounts?.name || ""}</small></td><td>{item.description}</td><td className="num">{item.quantity}</td><td className="num">{money(Number(item.unit_price))}</td><td className="num"><b>{money(Number(item.line_total))}</b></td></tr>)}</tbody></table></div> : <p className="muted">Aún no se han añadido artículos.</p>}
          {req.justification ? <><h3>Justificación</h3><p>{req.justification}</p></> : null}
        </section>

        {editable ? <RecordLockGuard organizationId={organizationId} entityType="REQUISITION" entityId={id} activity="EDITAR_REQUISICION">{editor}</RecordLockGuard> : null}
      </div>
    </AppShell>
  );
}
