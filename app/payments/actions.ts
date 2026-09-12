"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function client(){await requireUser();return createClient();}

export async function createPayment(formData:FormData){
 const supabase=await client(); const voucherId=String(formData.get("voucherId")||""); const amount=Number(formData.get("amount")||0); const method=String(formData.get("method")||"").trim(); const reference=String(formData.get("reference")||"").trim();
 const {data,error}=await supabase.rpc("create_payment",{p_voucher:voucherId,p_amount:amount,p_method:method,p_reference:reference});
 if(error) redirect(`/payments?error=${encodeURIComponent(error.message)}`);
 revalidatePath("/payments");revalidatePath("/vouchers");revalidatePath("/dashboard");
 redirect(`/payments?message=${encodeURIComponent(`Pago ${data?.payment_no||""} creado en borrador.`)}`);
}

export async function postPayment(formData:FormData){
 const supabase=await client(); const paymentId=String(formData.get("paymentId")||"");
 const {data,error}=await supabase.rpc("post_payment",{p_payment:paymentId});
 if(error) redirect(`/payments?error=${encodeURIComponent(error.message)}`);
 revalidatePath("/payments");revalidatePath("/vouchers");revalidatePath("/budget");revalidatePath("/dashboard");
 redirect(`/payments?message=${encodeURIComponent(`Pago ${data?.payment_no||""} contabilizado.`)}`);
}
