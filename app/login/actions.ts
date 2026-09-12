"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_REDIRECT = "https://fynexo.onrender.com/auth/callback?next=/reset-password";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("resetEmail") || "").trim().toLowerCase();
  if (!email) redirect(`/login?error=${encodeURIComponent("Escriba el correo de la cuenta que desea recuperar.")}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: RECOVERY_REDIRECT,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?message=${encodeURIComponent("Si la cuenta existe, recibirá un correo para restablecer la contraseña.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
