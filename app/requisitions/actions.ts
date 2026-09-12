"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function context() {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  if (!membership?.organization_id) throw new Error("No active organization membership");
  return { supabase, organizationId: membership.organization_id };
}

export async function createRequisition(formData: FormData) {
  const { supabase, organizationId } = await context();
  const title = String(formData.get("title") || "").trim();
  const justification = String(formData.get("justification") || "").trim();
  const vendorId = String(formData.get("vendorId") || "");
  const { data, error } = await supabase.rpc("create_requisition_draft", {
    p_org: organizationId,
    p_title: title,
    p_justification: justification || null,
    p_vendor: vendorId || null,
  });
  if (error) redirect(`/requisitions/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/requisitions");
  redirect(`/requisitions/${data}`);
}

export async function addRequisitionItem(formData: FormData) {
  const { supabase } = await context();
  const requisitionId = String(formData.get("requisitionId") || "");
  const budgetLineId = String(formData.get("budgetLineId") || "");
  const description = String(formData.get("description") || "").trim();
  const quantity = Number(formData.get("quantity") || 0);
  const unitPrice = Number(formData.get("unitPrice") || 0);
  const { error } = await supabase.rpc("add_requisition_item", {
    p_requisition: requisitionId,
    p_budget_line: budgetLineId,
    p_description: description,
    p_quantity: quantity,
    p_unit_price: unitPrice,
  });
  if (error) redirect(`/requisitions/${requisitionId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/requisitions/${requisitionId}`);
  revalidatePath("/requisitions");
  redirect(`/requisitions/${requisitionId}?message=${encodeURIComponent("Artículo agregado y disponibilidad validada.")}`);
}

export async function submitRequisition(formData: FormData) {
  const { supabase } = await context();
  const requisitionId = String(formData.get("requisitionId") || "");
  const { error } = await supabase.rpc("submit_requisition", { p_requisition: requisitionId });
  if (error) redirect(`/requisitions/${requisitionId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/requisitions/${requisitionId}`);
  revalidatePath("/requisitions");
  revalidatePath("/dashboard");
  redirect(`/requisitions/${requisitionId}?message=${encodeURIComponent("Requisición sometida para aprobación.")}`);
}

export async function approveRequisition(formData: FormData) {
  const { supabase } = await context();
  const requisitionId = String(formData.get("requisitionId") || "");
  const comments = String(formData.get("comments") || "").trim();
  const { error } = await supabase.rpc("approve_requisition", { p_requisition: requisitionId, p_comments: comments || null });
  if (error) redirect(`/requisitions/${requisitionId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/requisitions/${requisitionId}`);
  revalidatePath("/requisitions");
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect(`/requisitions/${requisitionId}?message=${encodeURIComponent("Requisición aprobada y compromiso registrado.")}`);
}
