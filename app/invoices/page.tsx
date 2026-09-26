import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createInvoiceForReceived } from "./actions";

function money(v:number){return new Intl.NumberFormat("es-PR",{style:"currency",currency:"USD"}).format(v||0)}

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const params=await searchParams; const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 const [{data:pos},{data:invoices}]=await Promise.all([
  org?supabase.from("purchase_orders").select("id,po_no,status,vendors(legal_name)").eq("organization_id",org).in("status",["PARTIALLY_RECEIVED","RECEIVED"]).order("created_at",{ascending:false}):Promise.resolve({data:[]} as any),
  org?supabase.from("invoices").select("id,invoice_no,invoice_date,total_amount,match_status,purchase_orders(po_no),vendors(legal_name)").eq("organization_id",org).order("created_at",{ascending:false}).limit(100):Promise.resolve({data:[]} as any)
 ]);
 return <AppShell title="FYNEXO Pay · Facturas" subtitle="Registro y Three-Way Match contra orden y recepción.">
 {params.error?<div className="error-box" role="alert">{params.error}</div>:null}{params.message?<div className="success-box" role="status">{params.message}</div>:null}
 <section className="panel"><p className="eyebrow">Captura</p><h2>Facturar cantidades recibidas</h2>{(pos||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>PO</th><th>Proveedor</th><th>Factura</th><th>Fecha</th><th></th></tr></thead><tbody>{(pos||[]).map((p:any)=><tr key={p.id}><td><b>{p.po_no}</b></td><td>{p.vendors?.legal_name||"—"}</td><td colSpan={3}><form action={createInvoiceForReceived} className="inline-form"><input type="hidden" name="poId" value={p.id}/><input name="invoiceNo" placeholder="Núm. factura" required/><input name="invoiceDate" type="date" required/><button className="primary-button">Registrar y validar match</button></form></td></tr>)}</tbody></table></div>:<p className="muted">No hay órdenes con recepción disponible para facturar.</p>}</section>
 <section className="panel top-gap"><p className="eyebrow">Three-Way Match</p><h2>Facturas</h2>{(invoices||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Factura</th><th>PO</th><th>Proveedor</th><th>Fecha</th><th>Match</th><th className="num">Total</th></tr></thead><tbody>{(invoices||[]).map((i:any)=><tr key={i.id}><td><b>{i.invoice_no}</b></td><td>{i.purchase_orders?.po_no||"—"}</td><td>{i.vendors?.legal_name||"—"}</td><td>{i.invoice_date||"—"}</td><td><span className="status-pill">{i.match_status}</span></td><td className="num">{money(Number(i.total_amount))}</td></tr>)}</tbody></table></div>:<p className="muted">Aún no hay facturas.</p>}</section>
 </AppShell>
}
