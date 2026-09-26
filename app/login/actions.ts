"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_REDIRECT = "https://fynexo.onrender.com/reset-password";

function publicAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email rate limit exceeded") || normalized.includes("rate limit")) {
    return "Se alcanzó temporalmente el límite de correos de recuperación. Espere unos minutos antes de intentar nuevamente.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "El correo electrónico o la contraseña no son correctos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Debe confirmar su correo electrónico antes de iniciar sesión.";
  }

  return "No fue posible completar la solicitud de acceso. Intente nuevamente.";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(publicAuthError(error.message))}`);
  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("resetEmail") || "").trim().toLowerCase();
  if (!email) redirect(`/login?error=${encodeURIComponent("Escriba el correo de la cuenta que desea recuperar.")}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: RECOVERY_REDIRECT,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(publicAuthError(error.message))}`);
  redirect(`/login?message=${encodeURIComponent("Si existe una cuenta asociada a ese correo, recibirá instrucciones para restablecer su contraseña.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
