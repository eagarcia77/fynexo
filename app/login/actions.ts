"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function bootstrapAdmin(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const bootstrapCode = String(formData.get("bootstrapCode") || "").trim();

  const expectedCode = process.env.FYNEXO_BOOTSTRAP_CODE || "";
  const expectedEmail = (process.env.FYNEXO_ADMIN_EMAIL || "").trim().toLowerCase();

  if (!expectedCode || bootstrapCode !== expectedCode) {
    redirect("/login?error=" + encodeURIComponent("Código de inicialización inválido."));
  }
  if (!expectedEmail || email !== expectedEmail) {
    redirect("/login?error=" + encodeURIComponent("Este correo no está autorizado para inicializar FYNEXO."));
  }
  if (password.length < 12) {
    redirect("/login?error=" + encodeURIComponent("La contraseña inicial debe tener al menos 12 caracteres."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || "Administrador FYNEXO" } },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  if (data.session) redirect("/dashboard");
  redirect("/login?message=" + encodeURIComponent("Cuenta creada. Revise su correo para confirmar el acceso y luego inicie sesión."));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
