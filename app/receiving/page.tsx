import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { receiveRemaining } from "./actions";

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const params=await searchParams; const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); const org=m?.organization_id;
 const [{data:pos},{data:receipts}]=await Promise.all([
  org?supabase.from("purchase_orders").select("id,po_no,status,total_amount,vendors(legal_name)").eq("organization_id",org).in("status",["ISSUED","PARTIALLY_RECEIVED"]).order("issued_at",{ascending:false}):Promise.resolve({data:[]} as any),
  org?supabase.from("receipts").select("id,receipt_no,status,received_at,purchase_orders(po_no)").eq("organization_id",org).order("created_at",{ascending:false}).limit(100):Promise.resolve({data:[]} as any)
 ]);
 return <AppShell title="FYNEXO Receive" subtitle="Recepción total y parcial de bienes y servicios.">
  {params.error?<div className="error-box">{params.error}</div>:null}{params.message?<div className="success-box">{params.message}</div>:null}
  <section className="panel"><p className="eyebrow">Pendiente</p><h2>Órdenes por recibir</h2>{(pos||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>PO</th><th>Proveedor</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{(pos||[]).map((p:any)=><tr key={p.id}><td><b>{p.po_no}</b></td><td>{p.vendors?.legal_name||"—"}</td><td><span className="status-pill">{p.status}</span></td><td><div className="inline-form"><Link href={`/receiving/${p.id}`} className="secondary-button">Recepción parcial</Link><form action={receiveRemaining}><input type="hidden" name="poId" value={p.id}/><button className="primary-button">Recibir todo pendiente</button></form></div></td></tr>)}</tbody></table></div>:<p className="muted">No hay órdenes pendientes de recepción.</p>}</section>
  <section className="panel top-gap"><p className="eyebrow">Historial</p><h2>Recepciones registradas</h2>{(receipts||[]).length?<div className="table-wrap"><table className="data-table"><thead><tr><th>Recepción</th><th>PO</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>{(receipts||[]).map((r:any)=><tr key={r.id}><td><b>{r.receipt_no}</b></td><td>{r.purchase_orders?.po_no||"—"}</td><td>{r.status}</td><td>{r.received_at?new Intl.DateTimeFormat("es-PR").format(new Date(r.received_at)):"—"}</td></tr>)}</tbody></table></div>:<p className="muted">Aún no hay recepciones.</p>}</section>
 </AppShell>
}
