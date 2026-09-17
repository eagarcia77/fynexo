"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function client() {
  await requireUser();
  return createClient();
}

function paymentError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("permission") || value.includes("not authorized") || value.includes("unauthorized")) {
    return "Su usuario no tiene autorización para realizar esta acción de pago.";
  }
  if (value.includes("own") || value.includes("creator") || value.includes("separation") || value.includes("sod")) {
    return "Por separación de funciones, el usuario que creó el pago no puede contabilizarlo.";
  }
  if (value.includes("amount") || value.includes("exceed") || value.includes("outstanding")) {
    return "El importe del pago no es válido o excede el balance pendiente del comprobante.";
  }
  if (value.includes("status") || value.includes("state")) {
    return "El documento ya no se encuentra en un estado válido para esta operación.";
  }
  return "No fue posible completar la operación de pago. Verifique los datos e intente nuevamente.";
}

export async function createPayment(formData: FormData) {
  const supabase = await client();
  const voucherId = String(formData.get("voucherId") || "");
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("method") || "").trim();
  const reference = String(formData.get("reference") || "").trim();

  if (!voucherId || !Number.isFinite(amount) || amount <= 0 || !method) {
    redirect(`/payments?error=${encodeURIComponent("Complete los datos requeridos e indique un importe mayor de $0.00.")}`);
  }

  const { data, error } = await supabase.rpc("create_payment", {
    p_voucher: voucherId,
    p_amount: amount,
    p_method: method,
    p_reference: reference,
  });
  if (error) redirect(`/payments?error=${encodeURIComponent(paymentError(error.message))}`);

  revalidatePath("/payments");
  revalidatePath("/vouchers");
  revalidatePath("/dashboard");
  redirect(`/payments?message=${encodeURIComponent(`Pago ${data?.payment_no || ""} creado en borrador.`)}`);
}

export async function postPayment(formData: FormData) {
  const supabase = await client();
  const paymentId = String(formData.get("paymentId") || "");
  if (!paymentId) redirect(`/payments?error=${encodeURIComponent("No se pudo identificar el pago que desea contabilizar.")}`);

  const { data, error } = await supabase.rpc("post_payment", { p_payment: paymentId });
  if (error) redirect(`/payments?error=${encodeURIComponent(paymentError(error.message))}`);

  revalidatePath("/payments");
  revalidatePath("/vouchers");
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect(`/payments?message=${encodeURIComponent(`Pago ${data?.payment_no || ""} contabilizado.`)}`);
}
