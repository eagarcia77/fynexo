import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { receivePartial } from "../actions";

export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}){
 const {id}=await params; const msg=await searchParams; const {userId}=await requireUser(); const supabase=await createClient();
 const {data:m}=await supabase.from("organization_memberships").select("organization_id").eq("user_id",userId).eq("is_active",true).limit(1).maybeSingle(); if(!m?.organization_id) notFound();
 const {data:po}=await supabase.from("purchase_orders").select("id,po_no,status,vendors(legal_name)").eq("id",id).eq("organization_id",m.organization_id).maybeSingle(); if(!po) notFound();
 const [{data:items},{data:receipts}]=await Promise.all([supabase.from("purchase_order_items").select("id,description,quantity,unit_price").eq("purchase_order_id",id),supabase.from("receipts").select("id").eq("purchase_order_id",id).neq("status","CANCELLED")]);
 const receiptIds=(receipts||[]).map((r:any)=>r.id); let recItems:any[]=[]; if(receiptIds.length){const {data}=await supabase.from("receipt_items").select("purchase_order_item_id,quantity_received,quantity_rejected").in("receipt_id",receiptIds);recItems=data||[];}
 const used=new Map<string,number>(); for(const r of recItems) used.set(r.purchase_order_item_id,(used.get(r.purchase_order_item_id)||0)+Number(r.quantity_received||0)+Number(r.quantity_rejected||0));
 const pending=(items||[]).map((i:any)=>({...i,remaining:Math.max(0,Number(i.quantity||0)-(used.get(i.id)||0))})).filter((i:any)=>i.remaining>0);
 return <AppShell title={`Recepción ${po.po_no}`} subtitle={`Proveedor: ${po.vendors?.legal_name||"—"}`}>
  <div className="panel-header page-heading"><div><p className="eyebrow">Recepción parcial</p><h2>Cantidades por renglón</h2></div><Link href="/receiving" className="command-button">Volver</Link></div>
  {msg.error?<div className="error-box">{msg.error}</div>:null}
  <section className="panel">{pending.length?<form action={receivePartial}><input type="hidden" name="poId" value={id}/><input type="hidden" name="itemIds" value={pending.map((i:any)=>i.id).join(",")}/><div className="table-wrap"><table className="data-table"><thead><tr><th>Descripción</th><th className="num">Ordenado</th><th className="num">Pendiente</th><th>Recibido</th><th>Rechazado</th><th>Notas</th></tr></thead><tbody>{pending.map((i:any)=><tr key={i.id}><td>{i.description}</td><td className="num">{i.quantity}</td><td className="num"><b>{i.remaining}</b></td><td><input name={`received_${i.id}`} type="number" min="0" max={i.remaining} step="0.01" defaultValue="0"/></td><td><input name={`rejected_${i.id}`} type="number" min="0" max={i.remaining} step="0.01" defaultValue="0"/></td><td><input name={`notes_${i.id}`} placeholder="Opcional"/></td></tr>)}</tbody></table></div><div className="form-actions top-gap"><button className="primary-button">Registrar recepción parcial</button></div></form>:<p className="muted">La orden no tiene cantidades pendientes.</p>}</section>
 </AppShell>
}
