import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createPurchaseOrder, issuePurchaseOrder } from "./actions";

function money(v:number){return new Intl.NumberFormat("es-PR",{style:"currency",currency:"USD"}).format(v||0)}

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const params=await searchParams; const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 const [{data:reqs},{data:pos}]=await Promise.all([
  org?supabase.from("requisitions").select("id,requisition_no,title,total_amount,vendors(legal_name)").eq("organization_id",org).eq("status","APPROVED").order("approved_at",{ascending:false}):Promise.resolve({data:[]} as any),
  org?supabase.from("purchase_orders").select("id,po_no,status,total_amount,issued_at,requisitions(requisition_no,title),vendors(legal_name)").eq("organization_id",org).order("created_at",{ascending:false}):Promise.resolve({data:[]} as any)
 ]);
 return <AppShell title="FYNEXO Orders" subtitle="Órdenes de compra y control de emisión.">
  {params.error?<div className="error-box">{params.error}</div>:null}{params.message?<div className="success-box">{params.message}</div>:null}
  <section className="panel"><p className="eyebrow">Por convertir</p><h2>Requisiciones aprobadas</h2>{(reqs||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Requisición</th><th>Título</th><th>Proveedor</th><th className="num">Total</th><th></th></tr></thead><tbody>{(reqs||[]).map((r:any)=><tr key={r.id}><td><b>{r.requisition_no}</b></td><td>{r.title}</td><td>{r.vendors?.legal_name||"—"}</td><td className="num">{money(Number(r.total_amount))}</td><td><form action={createPurchaseOrder}><input type="hidden" name="requisitionId" value={r.id}/><button className="secondary-button">Crear PO</button></form></td></tr>)}</tbody></table></div>:<p className="muted">No hay requisiciones aprobadas pendientes de orden.</p>}</section>
  <section className="panel top-gap"><p className="eyebrow">Órdenes</p><h2>Purchase Orders</h2>{(pos||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>PO</th><th>Requisición</th><th>Proveedor</th><th>Estado</th><th className="num">Total</th><th></th></tr></thead><tbody>{(pos||[]).map((p:any)=><tr key={p.id}><td><b>{p.po_no}</b></td><td>{p.requisitions?.requisition_no||"—"}</td><td>{p.vendors?.legal_name||"—"}</td><td><span className="status-pill">{p.status}</span></td><td className="num">{money(Number(p.total_amount))}</td><td>{p.status==="DRAFT"?<form action={issuePurchaseOrder}><input type="hidden" name="poId" value={p.id}/><button className="primary-button">Emitir</button></form>:null}</td></tr>)}</tbody></table></div>:<p className="muted">No hay órdenes todavía.</p>}</section>
 </AppShell>
}
