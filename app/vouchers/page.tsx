import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { approveVoucher, createVoucher } from "./actions";

function money(v:number){return new Intl.NumberFormat("es-PR",{style:"currency",currency:"USD"}).format(v||0)}

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const params=await searchParams; const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 const [{data:matched},{data:vouchers,error:voucherError}]=await Promise.all([
  org?supabase.from("invoices").select("id,invoice_no,total_amount,purchase_orders(po_no),vendors(legal_name),vouchers(id,status)").eq("organization_id",org).eq("match_status","MATCHED").order("created_at",{ascending:false}):Promise.resolve({data:[]} as any),
  org?supabase.from("vouchers").select("id,voucher_no,status,total_amount,created_by,approved_at,invoices(invoice_no)").eq("organization_id",org).order("created_at",{ascending:false}).limit(100):Promise.resolve({data:[],error:null} as any)
 ]);
 const available=(matched||[]).filter((i:any)=>!(i.vouchers||[]).some((v:any)=>v.status!=="CANCELLED"));
 return <AppShell title="FYNEXO Pay · Comprobantes" subtitle="Conversión de compromisos en obligaciones, con Three-Way Match.">
 {params.error?<div className="error-box" role="alert">{params.error}</div>:null}{params.message?<div className="success-box" role="status">{params.message}</div>:null}
 {voucherError?<div className="error-box" role="alert">No se pudieron cargar los comprobantes: {voucherError.message}</div>:null}
 <section className="panel"><p className="eyebrow">Listas para obligación</p><h2>Facturas MATCHED</h2>{available.length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Factura</th><th>PO</th><th>Proveedor</th><th className="num">Total</th><th></th></tr></thead><tbody>{available.map((i:any)=><tr key={i.id}><td><b>{i.invoice_no}</b></td><td>{i.purchase_orders?.po_no||"—"}</td><td>{i.vendors?.legal_name||"—"}</td><td className="num">{money(Number(i.total_amount))}</td><td><form action={createVoucher}><input type="hidden" name="invoiceId" value={i.id}/><button className="secondary-button">Crear comprobante</button></form></td></tr>)}</tbody></table></div>:<p className="muted">No hay facturas MATCHED pendientes de comprobante.</p>}</section>
 <section className="panel top-gap"><p className="eyebrow">Obligaciones</p><h2>Comprobantes</h2>{(vouchers||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Comprobante</th><th>Factura</th><th>Estado</th><th className="num">Total</th><th></th></tr></thead><tbody>{(vouchers||[]).map((v:any)=><tr key={v.id}><td><b>{v.voucher_no}</b></td><td>{v.invoices?.invoice_no||"—"}</td><td><span className="status-pill">{v.status}</span></td><td className="num">{money(Number(v.total_amount))}</td><td>{v.status==="DRAFT"&&v.created_by!==userId?<form action={approveVoucher}><input type="hidden" name="voucherId" value={v.id}/><button className="primary-button">Aprobar</button></form>:v.status==="DRAFT"?<span className="tiny">SoD: requiere otro aprobador</span>:null}</td></tr>)}</tbody></table></div>:!voucherError?<p className="muted">Aún no hay comprobantes.</p>:null}</section>
 </AppShell>
}
