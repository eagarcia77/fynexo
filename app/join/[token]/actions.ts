"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function acceptInvitation(supabase: Awaited<ReturnType<typeof createClient>>, token: string, fullName: string) {
  const { error } = await supabase.rpc("accept_user_invitation", { p_token: token, p_full_name: fullName || null });
  if (error) redirect(`/join/${encodeURIComponent(token)}?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function joinWithNewAccount(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (password.length < 12) redirect(`/join/${encodeURIComponent(token)}?error=${encodeURIComponent("La contraseña debe tener al menos 12 caracteres.")}`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) redirect(`/join/${encodeURIComponent(token)}?error=${encodeURIComponent(error.message)}`);
  if (data.session) await acceptInvitation(supabase, token, fullName);
  redirect(`/join/${encodeURIComponent(token)}?message=${encodeURIComponent("Cuenta creada. Confirme su correo si Supabase lo solicita y luego use 'Ya tengo cuenta' para aceptar la invitación.")}`);
}

export async function joinWithExistingAccount(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/join/${encodeURIComponent(token)}?error=${encodeURIComponent(error.message)}`);
  await acceptInvitation(supabase, token, fullName);
}
