"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

function operationError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("permission") || value.includes("unauthorized") || value.includes("not authorized")) return "Su usuario no tiene autorización para realizar esta acción.";
  if (value.includes("status") || value.includes("state")) return "El documento ya no se encuentra en un estado válido para esta operación.";
  if (value.includes("amount") || value.includes("quantity") || value.includes("exceed") || value.includes("available")) return "Los importes o cantidades indicados no son válidos o exceden el balance disponible.";
  if (value.includes("duplicate") || value.includes("unique")) return "Ya existe un registro con esos datos. Verifique la información.";
  if (value.includes("sod") || value.includes("own") || value.includes("creator") || value.includes("separation")) return "La separación de funciones requiere que esta acción la complete otro usuario autorizado.";
  return "No fue posible completar la operación. Verifique los datos e intente nuevamente.";
}

async function postReceipt(poId:string,payload:any[],returnPath:string){
 await requireUser(); const supabase=await createClient();
 if(!payload.length) redirect(`${returnPath}?error=${encodeURIComponent("Debe registrar al menos una cantidad recibida o rechazada.")}`);
 const {data,error}=await supabase.rpc("create_receipt",{p_po:poId,p_items:payload});
 if(error) redirect(`${returnPath}?error=${encodeURIComponent(operationError(error.message))}`);
 revalidatePath("/receiving");revalidatePath(`/receiving/${poId}`);revalidatePath("/orders");revalidatePath("/invoices");revalidatePath("/dashboard");
 redirect(`/receiving?message=${encodeURIComponent(`Recepción ${data?.receipt_no||""} registrada.`)}`);
}

export async function receiveRemaining(formData: FormData){
 await requireUser(); const supabase=await createClient(); const poId=String(formData.get("poId")||"");
 const [{data:items},{data:receipts}]=await Promise.all([
  supabase.from("purchase_order_items").select("id,quantity").eq("purchase_order_id",poId),
  supabase.from("receipts").select("id").eq("purchase_order_id",poId).neq("status","CANCELLED")
 ]);
 const receiptIds=(receipts||[]).map((r:any)=>r.id); let received:any[]=[];
 if(receiptIds.length){const {data}=await supabase.from("receipt_items").select("purchase_order_item_id,quantity_received,quantity_rejected").in("receipt_id",receiptIds); received=data||[];}
 const accepted=new Map<string,number>(); for(const r of received){accepted.set(r.purchase_order_item_id,(accepted.get(r.purchase_order_item_id)||0)+Number(r.quantity_received||0));}
 const payload=(items||[]).map((i:any)=>({purchase_order_item_id:i.id,quantity_received:Math.max(0,Number(i.quantity||0)-(accepted.get(i.id)||0)),quantity_rejected:0})).filter((i:any)=>i.quantity_received>0);
 return postReceipt(poId,payload,"/receiving");
}

export async function receivePartial(formData:FormData){
 const poId=String(formData.get("poId")||""); const itemIds=String(formData.get("itemIds")||"").split(",").filter(Boolean);
 const payload=itemIds.map(id=>({purchase_order_item_id:id,quantity_received:Number(formData.get(`received_${id}`)||0),quantity_rejected:Number(formData.get(`rejected_${id}`)||0),notes:String(formData.get(`notes_${id}`)||"").trim()})).filter(x=>x.quantity_received>0||x.quantity_rejected>0);
 return postReceipt(poId,payload,`/receiving/${poId}`);
}
