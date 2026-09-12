"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function client() {
  await requireUser();
  return createClient();
}

export async function assignVendor(formData: FormData) {
  const supabase = await client();
  const requisitionId = String(formData.get("requisitionId") || "");
  const vendorId = String(formData.get("vendorId") || "");
  if (!requisitionId || !vendorId) redirect(`/orders?error=${encodeURIComponent("Seleccione un proveedor activo.")}`);
  const { error } = await supabase.rpc("assign_vendor_to_requisition", { p_requisition: requisitionId, p_vendor: vendorId });
  if (error) redirect(`/orders?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/orders"); revalidatePath("/requisitions"); revalidatePath("/dashboard");
  redirect(`/orders?message=${encodeURIComponent("Proveedor asignado a la requisición.")}`);
}

export async function createPurchaseOrder(formData: FormData) {
  const supabase = await client();
  const requisitionId = String(formData.get("requisitionId") || "");
  const { data, error } = await supabase.rpc("create_purchase_order_from_requisition", { p_requisition: requisitionId });
  if (error) redirect(`/orders?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/orders"); revalidatePath("/requisitions"); revalidatePath("/dashboard");
  redirect(`/orders?message=${encodeURIComponent(`Orden ${data?.po_no || ""} creada.`)}`);
}

export async function issuePurchaseOrder(formData: FormData) {
  const supabase = await client();
  const poId = String(formData.get("poId") || "");
  const { data, error } = await supabase.rpc("issue_purchase_order", { p_po: poId });
  if (error) redirect(`/orders?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/orders"); revalidatePath("/receiving"); revalidatePath("/dashboard");
  redirect(`/orders?message=${encodeURIComponent(`Orden ${data?.po_no || ""} emitida.`)}`);
}
