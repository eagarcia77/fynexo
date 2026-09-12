"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export async function receiveRemaining(formData: FormData){
 await requireUser(); const supabase=await createClient(); const poId=String(formData.get("poId")||"");
 const [{data:items},{data:receipts}]=await Promise.all([
  supabase.from("purchase_order_items").select("id,quantity").eq("purchase_order_id",poId),
  supabase.from("receipts").select("id").eq("purchase_order_id",poId).neq("status","CANCELLED")
 ]);
 const receiptIds=(receipts||[]).map((r:any)=>r.id); let received:any[]=[];
 if(receiptIds.length){const {data}=await supabase.from("receipt_items").select("purchase_order_item_id,quantity_received,quantity_rejected").in("receipt_id",receiptIds); received=data||[];}
 const used=new Map<string,number>(); for(const r of received){used.set(r.purchase_order_item_id,(used.get(r.purchase_order_item_id)||0)+Number(r.quantity_received||0)+Number(r.quantity_rejected||0));}
 const payload=(items||[]).map((i:any)=>({purchase_order_item_id:i.id,quantity_received:Math.max(0,Number(i.quantity||0)-(used.get(i.id)||0)),quantity_rejected:0})).filter((i:any)=>i.quantity_received>0);
 if(!payload.length) redirect(`/receiving?error=${encodeURIComponent("La orden no tiene cantidades pendientes de recibir.")}`);
 const {data,error}=await supabase.rpc("create_receipt",{p_po:poId,p_items:payload});
 if(error) redirect(`/receiving?error=${encodeURIComponent(error.message)}`);
 revalidatePath("/receiving"); revalidatePath("/orders"); revalidatePath("/invoices"); revalidatePath("/dashboard");
 redirect(`/receiving?message=${encodeURIComponent(`Recepción ${data?.receipt_no||""} registrada.`)}`);
}
