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
  if (error) {
    const value = error.message.toLowerCase();
    const message = value.includes("weak password") || value.includes("password should be")
      ? "La contraseña no cumple con los requisitos de seguridad."
      : value.includes("same password")
        ? "La nueva contraseña debe ser diferente a la contraseña anterior."
        : value.includes("session") || value.includes("jwt") || value.includes("expired")
          ? "La sesión de recuperación expiró. Solicite un enlace nuevo."
          : "No fue posible actualizar la contraseña. Solicite un enlace nuevo e intente nuevamente.";
    redirect(`/reset-password?error=${encodeURIComponent(message)}`);
  }

  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("Contraseña actualizada. Inicie sesión con la nueva contraseña.")}`);
}
