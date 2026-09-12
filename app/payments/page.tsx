import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createPayment, postPayment } from "./actions";

function money(v:number){return new Intl.NumberFormat("es-PR",{style:"currency",currency:"USD"}).format(v||0)}

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const params=await searchParams; const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 const [{data:vouchers},{data:payments},{data:allocs}]=await Promise.all([
  org?supabase.from("vouchers").select("id,voucher_no,status,total_amount,invoices(invoice_no)").eq("organization_id",org).in("status",["APPROVED","PARTIALLY_PAID"]).order("approved_at",{ascending:false}):Promise.resolve({data:[]} as any),
  org?supabase.from("payments").select("id,payment_no,status,payment_method,transaction_reference,total_amount,created_by,posted_at").eq("organization_id",org).order("created_at",{ascending:false}).limit(100):Promise.resolve({data:[]} as any),
  org?supabase.from("payment_allocations").select("voucher_id,amount,payments!inner(status,organization_id)").eq("payments.organization_id",org).eq("payments.status","POSTED"):Promise.resolve({data:[]} as any)
 ]);
 const paid=new Map<string,number>(); for(const a of allocs||[]) paid.set((a as any).voucher_id,(paid.get((a as any).voucher_id)||0)+Number((a as any).amount||0));
 return <AppShell title="FYNEXO Pay · Pagos" subtitle="Desembolsos, pagos parciales y conversión de obligaciones en gasto.">
 {params.error?<div className="error-box">{params.error}</div>:null}{params.message?<div className="success-box">{params.message}</div>:null}
 <section className="panel"><p className="eyebrow">Por pagar</p><h2>Obligaciones aprobadas</h2>{(vouchers||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Comprobante</th><th>Factura</th><th>Estado</th><th className="num">Pendiente</th><th>Pago</th></tr></thead><tbody>{(vouchers||[]).map((v:any)=>{const outstanding=Math.max(0,Number(v.total_amount||0)-(paid.get(v.id)||0));return <tr key={v.id}><td><b>{v.voucher_no}</b></td><td>{v.invoices?.invoice_no||"—"}</td><td><span className="status-pill">{v.status}</span></td><td className="num"><b>{money(outstanding)}</b></td><td><form action={createPayment} className="inline-form"><input type="hidden" name="voucherId" value={v.id}/><input name="amount" type="number" min="0.01" max={outstanding} step="0.01" defaultValue={outstanding} required/><select name="method" required><option value="ACH">ACH</option><option value="CHECK">Cheque</option><option value="WIRE">Transferencia</option><option value="OTHER">Otro</option></select><input name="reference" placeholder="Referencia"/><button className="secondary-button">Crear pago</button></form></td></tr>})}</tbody></table></div>:<p className="muted">No hay obligaciones listas para pago.</p>}</section>
 <section className="panel top-gap"><p className="eyebrow">Desembolsos</p><h2>Pagos</h2>{(payments||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Pago</th><th>Método</th><th>Referencia</th><th>Estado</th><th className="num">Total</th><th></th></tr></thead><tbody>{(payments||[]).map((p:any)=><tr key={p.id}><td><b>{p.payment_no}</b></td><td>{p.payment_method||"—"}</td><td>{p.transaction_reference||"—"}</td><td><span className="status-pill">{p.status}</span></td><td className="num">{money(Number(p.total_amount))}</td><td>{p.status==="DRAFT"&&p.created_by!==userId?<form action={postPayment}><input type="hidden" name="paymentId" value={p.id}/><button className="primary-button">Contabilizar</button></form>:p.status==="DRAFT"?<span className="tiny">SoD: requiere otro usuario</span>:null}</td></tr>)}</tbody></table></div>:<p className="muted">Aún no hay pagos.</p>}</section>
 </AppShell>
}
