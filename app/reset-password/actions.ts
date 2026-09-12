"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 12) redirect(`/reset-password?error=${encodeURIComponent("La contraseña debe tener al menos 12 caracteres.")}`);
  if (password !== confirmPassword) redirect(`/reset-password?error=${encodeURIComponent("Las contraseñas no coinciden.")}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);

  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("Contraseña actualizada. Inicie sesión con la nueva contraseña.")}`);
}
