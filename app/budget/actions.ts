"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

function budgetError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("permission") || value.includes("unauthorized") || value.includes("not authorized")) return "Su usuario no tiene autorización para modificar el presupuesto.";
  if (value.includes("duplicate") || value.includes("unique")) return "Ya existe un registro con esa combinación de datos.";
  if (value.includes("amount") || value.includes("negative") || value.includes("available")) return "El importe presupuestario indicado no es válido.";
  if (value.includes("fiscal") || value.includes("period") || value.includes("closed")) return "El periodo fiscal no está disponible para esta operación.";
  return "No fue posible completar la operación presupuestaria. Verifique los datos e intente nuevamente.";
}

async function currentContext() {
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
  const { data: fy } = await supabase
    .from("fiscal_years")
    .select("id")
    .eq("organization_id", membership.organization_id)
    .eq("status", "OPEN")
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!fy?.id) throw new Error("No open fiscal year");
  return { supabase, organizationId: membership.organization_id, fiscalYearId: fy.id };
}

export async function createBudgetDimension(formData: FormData) {
  const { supabase, organizationId } = await currentContext();
  const kind = String(formData.get("kind") || "");
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const accountType = String(formData.get("accountType") || "").trim();
  const { error } = await supabase.rpc("create_budget_dimension", {
    p_org: organizationId,
    p_kind: kind,
    p_code: code,
    p_name: name,
    p_account_type: accountType || null,
  });
  if (error) redirect(`/budget/new?error=${encodeURIComponent(budgetError(error.message))}`);
  revalidatePath("/budget/new");
  revalidatePath("/budget");
  redirect("/budget/new?message=" + encodeURIComponent("Catálogo actualizado correctamente."));
}

export async function createBudgetLine(formData: FormData) {
  const { supabase, organizationId, fiscalYearId } = await currentContext();
  const accountId = String(formData.get("accountId") || "");
  const amount = Number(formData.get("amount") || 0);
  const optional = (name: string) => {
    const value = String(formData.get(name) || "");
    return value || null;
  };
  const { error } = await supabase.rpc("create_budget_line_and_post", {
    p_org: organizationId,
    p_fiscal_year: fiscalYearId,
    p_account: accountId,
    p_initial_amount: amount,
    p_department: optional("departmentId"),
    p_fund: optional("fundId"),
    p_program: optional("programId"),
    p_project: optional("projectId"),
    p_cost_center: optional("costCenterId"),
  });
  if (error) redirect(`/budget/new?error=${encodeURIComponent(budgetError(error.message))}`);
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  redirect("/budget?message=" + encodeURIComponent("Partida creada y presupuesto inicial publicado al ledger."));
}
