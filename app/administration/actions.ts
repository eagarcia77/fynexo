"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

function adminError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("admin_required") || value.includes("permission") || value.includes("unauthorized")) return "Acceso administrativo requerido.";
  if (value.includes("duplicate") || value.includes("unique") || value.includes("already")) return "El usuario o la invitación ya existe.";
  if (value.includes("expired")) return "La invitación expiró. Cree una nueva invitación.";
  return "No fue posible completar la operación administrativa. Intente nuevamente.";
}

function passwordResetError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email rate limit exceeded") || normalized.includes("rate limit")) {
    return "Se alcanzó temporalmente el límite de correos de recuperación. Espere unos minutos antes de intentar nuevamente.";
  }
  return "No fue posible enviar el enlace de recuperación. Intente nuevamente.";
}

async function context() {
  const { userId } = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_memberships").select("organization_id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
  if (!membership?.organization_id) throw new Error("No active organization membership");
  const { data: users, error } = await supabase.rpc("admin_list_org_users", { p_org: membership.organization_id });
  if (error) redirect(`/dashboard?error=${encodeURIComponent("Acceso administrativo requerido.")}`);
  return { supabase, organizationId: membership.organization_id, users: users || [] };
}

export async function createInvitation(formData: FormData) {
  const { supabase, organizationId } = await context();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") || "");
  const expiresHours = Number(formData.get("expiresHours") || 72);
  const { data, error } = await supabase.rpc("create_user_invitation", { p_org: organizationId, p_email: email, p_role: roleId, p_expires_hours: expiresHours });
  if (error) redirect(`/administration?error=${encodeURIComponent(adminError(error.message))}`);
  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath("/administration");
  redirect(`/administration?invite=${encodeURIComponent(row?.token || "")}&email=${encodeURIComponent(email)}&expires=${encodeURIComponent(row?.expires_at || "")}`);
}

export async function revokeInvitation(formData: FormData) {
  const { supabase } = await context();
  const invitationId = String(formData.get("invitationId") || "");
  const { error } = await supabase.rpc("revoke_user_invitation", { p_invitation: invitationId });
  if (error) redirect(`/administration?error=${encodeURIComponent(adminError(error.message))}`);
  revalidatePath("/administration");
  redirect(`/administration?message=${encodeURIComponent("Invitación revocada.")}`);
}

export async function setUserRole(formData: FormData) {
  const { supabase, organizationId } = await context();
  const userId = String(formData.get("userId") || "");
  const roleId = String(formData.get("roleId") || "");
  const active = String(formData.get("active") || "true") === "true";
  const { error } = await supabase.rpc("set_user_role", { p_org: organizationId, p_user: userId, p_role: roleId, p_active: active });
  if (error) redirect(`/administration?error=${encodeURIComponent(adminError(error.message))}`);
  revalidatePath("/administration");
  redirect(`/administration?message=${encodeURIComponent("Rol de usuario actualizado.")}`);
}

export async function sendUserPasswordReset(formData: FormData) {
  const { supabase, users } = await context();
  const userId = String(formData.get("userId") || "");
  const target = users.find((u: any) => u.user_id === userId);
  const email = String(target?.email || "").trim().toLowerCase();
  if (!email) redirect(`/administration?error=${encodeURIComponent("No se encontró un correo válido para este usuario.")}`);
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://fynexo.onrender.com/reset-password" });
  if (error) redirect(`/administration?error=${encodeURIComponent(passwordResetError(error.message))}`);
  redirect(`/administration?message=${encodeURIComponent(`Enlace seguro para cambiar la contraseña enviado a ${email}.`)}`);
}
