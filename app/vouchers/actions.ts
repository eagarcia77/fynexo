"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function client(){await requireUser();return createClient();}

export async function createVoucher(formData:FormData){
 const supabase=await client(); const invoiceId=String(formData.get("invoiceId")||"");
 const {data,error}=await supabase.rpc("create_voucher_from_invoice",{p_invoice:invoiceId});
 if(error) redirect(`/vouchers?error=${encodeURIComponent(error.message)}`);
 revalidatePath("/vouchers");revalidatePath("/payments");revalidatePath("/dashboard");
 redirect(`/vouchers?message=${encodeURIComponent(`Comprobante ${data?.voucher_no||""} creado.`)}`);
}

export async function approveVoucher(formData:FormData){
 const supabase=await client(); const voucherId=String(formData.get("voucherId")||"");
 const {data,error}=await supabase.rpc("approve_voucher",{p_voucher:voucherId});
 if(error) redirect(`/vouchers?error=${encodeURIComponent(error.message)}`);
 revalidatePath("/vouchers");revalidatePath("/payments");revalidatePath("/budget");revalidatePath("/dashboard");
 redirect(`/vouchers?message=${encodeURIComponent(`Comprobante ${data?.voucher_no||""} aprobado y obligación registrada.`)}`);
}
