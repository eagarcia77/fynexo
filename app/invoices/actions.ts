"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export async function createInvoiceForReceived(formData: FormData){
 await requireUser(); const supabase=await createClient(); const poId=String(formData.get("poId")||""); const invoiceNo=String(formData.get("invoiceNo")||"").trim(); const invoiceDate=String(formData.get("invoiceDate")||"")||new Date().toISOString().slice(0,10);
 const [{data:items},{data:receipts},{data:invoices}]=await Promise.all([
  supabase.from("purchase_order_items").select("id,description,unit_price").eq("purchase_order_id",poId),
  supabase.from("receipts").select("id").eq("purchase_order_id",poId).neq("status","CANCELLED"),
  supabase.from("invoices").select("id").eq("purchase_order_id",poId)
 ]);
 const receiptIds=(receipts||[]).map((r:any)=>r.id); const invoiceIds=(invoices||[]).map((r:any)=>r.id); let recItems:any[]=[]; let invItems:any[]=[];
 if(receiptIds.length){const {data}=await supabase.from("receipt_items").select("purchase_order_item_id,quantity_received").in("receipt_id",receiptIds);recItems=data||[];}
 if(invoiceIds.length){const {data}=await supabase.from("invoice_items").select("purchase_order_item_id,quantity").in("invoice_id",invoiceIds);invItems=data||[];}
 const received=new Map<string,number>(); for(const r of recItems) received.set(r.purchase_order_item_id,(received.get(r.purchase_order_item_id)||0)+Number(r.quantity_received||0));
 const invoiced=new Map<string,number>(); for(const r of invItems) if(r.purchase_order_item_id) invoiced.set(r.purchase_order_item_id,(invoiced.get(r.purchase_order_item_id)||0)+Number(r.quantity||0));
 const payload=(items||[]).map((i:any)=>({purchase_order_item_id:i.id,quantity:Math.max(0,(received.get(i.id)||0)-(invoiced.get(i.id)||0)),unit_price:Number(i.unit_price||0)})).filter((i:any)=>i.quantity>0);
 if(!payload.length) redirect(`/invoices?error=${encodeURIComponent("No hay cantidades recibidas pendientes de facturar.")}`);
 const {data,error}=await supabase.rpc("create_invoice",{p_po:poId,p_invoice_no:invoiceNo,p_invoice_date:invoiceDate,p_items:payload});
 if(error) redirect(`/invoices?error=${encodeURIComponent(error.message)}`);
 revalidatePath("/invoices");revalidatePath("/vouchers");revalidatePath("/dashboard");
 redirect(`/invoices?message=${encodeURIComponent(`Factura ${data?.invoice_no||invoiceNo} registrada: ${data?.match_status||"PENDING"}.`)}`);
}
