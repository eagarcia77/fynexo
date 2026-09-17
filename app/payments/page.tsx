import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createPayment, postPayment } from "./actions";

function money(value: number) {
  return new Intl.NumberFormat("es-PR", { style: "currency", currency: "USD" }).format(value || 0);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
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
  const org = membership?.organization_id;

  const [{ data: canCreate }, { data: canPost }, { data: vouchers }, { data: payments }, { data: allocations }] = await Promise.all([
    org ? supabase.rpc("current_user_has_permission", { p_org: org, p_permission: "payment.create" }) : Promise.resolve({ data: false } as any),
    org ? supabase.rpc("current_user_has_permission", { p_org: org, p_permission: "payment.post" }) : Promise.resolve({ data: false } as any),
    org
      ? supabase.from("vouchers").select("id,voucher_no,status,total_amount,invoices(invoice_no)").eq("organization_id", org).in("status", ["APPROVED", "PARTIALLY_PAID"]).order("approved_at", { ascending: false })
      : Promise.resolve({ data: [] } as any),
    org
      ? supabase.from("payments").select("id,payment_no,status,payment_method,transaction_reference,total_amount,created_by,posted_at").eq("organization_id", org).order("created_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] } as any),
    org
      ? supabase.from("payment_allocations").select("voucher_id,amount,payments!inner(status,organization_id)").eq("payments.organization_id", org).eq("payments.status", "POSTED")
      : Promise.resolve({ data: [] } as any),
  ]);

  const paid = new Map<string, number>();
  for (const allocation of allocations || []) {
    const row = allocation as any;
    paid.set(row.voucher_id, (paid.get(row.voucher_id) || 0) + Number(row.amount || 0));
  }

  return (
    <AppShell title="FYNEXO Pay · Pagos" subtitle="Desembolsos, pagos parciales y conversión de obligaciones en gasto.">
      {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
      {params.message ? <div className="success-box" role="status">{params.message}</div> : null}

      <section className="panel">
        <p className="eyebrow">Por pagar</p>
        <h2>Obligaciones aprobadas</h2>
        {(vouchers || []).length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Comprobante</th><th>Factura</th><th>Estado</th><th className="num">Pendiente</th><th>Pago</th></tr></thead>
              <tbody>
                {(vouchers || []).map((voucher: any) => {
                  const outstanding = Math.max(0, Number(voucher.total_amount || 0) - (paid.get(voucher.id) || 0));
                  return (
                    <tr key={voucher.id}>
                      <td><b>{voucher.voucher_no}</b></td>
                      <td>{voucher.invoices?.invoice_no || "—"}</td>
                      <td><span className="status-pill">{voucher.status}</span></td>
                      <td className="num"><b>{money(outstanding)}</b></td>
                      <td>
                        {canCreate && outstanding > 0 ? (
                          <form action={createPayment} className="inline-form">
                            <input type="hidden" name="voucherId" value={voucher.id} />
                            <input aria-label={`Importe para ${voucher.voucher_no}`} name="amount" type="number" min="0.01" max={outstanding} step="0.01" defaultValue={outstanding} required />
                            <select aria-label={`Método de pago para ${voucher.voucher_no}`} name="method" required>
                              <option value="ACH">ACH</option><option value="CHECK">Cheque</option><option value="WIRE">Transferencia</option><option value="OTHER">Otro</option>
                            </select>
                            <input aria-label={`Referencia para ${voucher.voucher_no}`} name="reference" placeholder="Referencia" />
                            <button className="secondary-button" type="submit">Crear pago</button>
                          </form>
                        ) : outstanding <= 0 ? <span className="tiny">Sin balance pendiente</span> : <span className="tiny">Solo lectura</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No hay obligaciones listas para pago.</p>}
      </section>

      <section className="panel top-gap">
        <p className="eyebrow">Desembolsos</p>
        <h2>Pagos</h2>
        {(payments || []).length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Pago</th><th>Método</th><th>Referencia</th><th>Estado</th><th className="num">Total</th><th>Acción</th></tr></thead>
              <tbody>
                {(payments || []).map((payment: any) => (
                  <tr key={payment.id}>
                    <td><b>{payment.payment_no}</b></td><td>{payment.payment_method || "—"}</td><td>{payment.transaction_reference || "—"}</td>
                    <td><span className="status-pill">{payment.status}</span></td><td className="num">{money(Number(payment.total_amount))}</td>
                    <td>
                      {payment.status === "DRAFT" && payment.created_by === userId ? <span className="tiny">SoD: requiere otro usuario autorizado</span> : null}
                      {payment.status === "DRAFT" && payment.created_by !== userId && canPost ? (
                        <form action={postPayment}><input type="hidden" name="paymentId" value={payment.id} /><button className="primary-button" type="submit">Contabilizar</button></form>
                      ) : null}
                      {payment.status === "DRAFT" && payment.created_by !== userId && !canPost ? <span className="tiny">Sin permiso para contabilizar</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">Aún no hay pagos.</p>}
      </section>
    </AppShell>
  );
}
