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

async function client(){await requireUser();return createClient();}

export async function createVoucher(formData:FormData){
 const supabase=await client(); const invoiceId=String(formData.get("invoiceId")||"");
 const {data,error}=await supabase.rpc("create_voucher_from_invoice",{p_invoice:invoiceId});
 if(error) redirect(`/vouchers?error=${encodeURIComponent(operationError(error.message))}`);
 revalidatePath("/vouchers");revalidatePath("/payments");revalidatePath("/dashboard");
 redirect(`/vouchers?message=${encodeURIComponent(`Comprobante ${data?.voucher_no||""} creado.`)}`);
}

export async function approveVoucher(formData:FormData){
 const supabase=await client(); const voucherId=String(formData.get("voucherId")||"");
 const {data,error}=await supabase.rpc("approve_voucher",{p_voucher:voucherId});
 if(error) redirect(`/vouchers?error=${encodeURIComponent(operationError(error.message))}`);
 revalidatePath("/vouchers");revalidatePath("/payments");revalidatePath("/budget");revalidatePath("/dashboard");
 redirect(`/vouchers?message=${encodeURIComponent(`Comprobante ${data?.voucher_no||""} aprobado y obligación registrada.`)}`);
}
