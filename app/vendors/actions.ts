"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function context() {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!membership?.organization_id) throw new Error("No active organization membership");
  return { supabase, organizationId: membership.organization_id };
}

export async function createVendor(formData: FormData) {
  const { supabase, organizationId } = await context();
  const { error } = await supabase.rpc("create_vendor", {
    p_org: organizationId,
    p_legal_name: String(formData.get("legalName") || "").trim(),
    p_vendor_no: String(formData.get("vendorNo") || "").trim() || null,
    p_email: String(formData.get("email") || "").trim() || null,
    p_phone: String(formData.get("phone") || "").trim() || null,
    p_tax_id_masked: String(formData.get("taxIdMasked") || "").trim() || null,
  });
  if (error) redirect(`/vendors?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/vendors");
  redirect(`/vendors?message=${encodeURIComponent("Proveedor creado correctamente.")}`);
}

export async function updateVendor(formData: FormData) {
  const { supabase } = await context();
  const vendorId = String(formData.get("vendorId") || "");
  const { error } = await supabase.rpc("update_vendor", {
    p_vendor: vendorId,
    p_legal_name: String(formData.get("legalName") || "").trim(),
    p_email: String(formData.get("email") || "").trim() || null,
    p_phone: String(formData.get("phone") || "").trim() || null,
    p_tax_id_masked: String(formData.get("taxIdMasked") || "").trim() || null,
    p_status: String(formData.get("status") || "ACTIVE"),
  });
  if (error) redirect(`/vendors?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/vendors");
  redirect(`/vendors?message=${encodeURIComponent("Proveedor actualizado.")}`);
}
