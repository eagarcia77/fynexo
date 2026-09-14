"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function passwordUpdateError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("weak password") || normalized.includes("password should be")) {
    return "La contraseña no cumple con los requisitos de seguridad. Use una combinación más segura de letras, números y símbolos.";
  }
  if (normalized.includes("same password") || normalized.includes("different from the old password")) {
    return "La nueva contraseña debe ser diferente a la contraseña anterior.";
  }
  if (normalized.includes("session") || normalized.includes("jwt") || normalized.includes("expired")) {
    return "La sesión de recuperación expiró. Solicite un enlace nuevo e intente nuevamente.";
  }
  if (normalized.includes("rate limit")) {
    return "Se alcanzó temporalmente el límite de intentos. Espere unos minutos antes de volver a intentarlo.";
  }

  return "No fue posible actualizar la contraseña. Solicite un enlace nuevo e intente nuevamente.";
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function establishRecoverySession() {
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setError("El enlace de recuperación no es válido, expiró o ya fue utilizado.");
          return;
        }
        window.history.replaceState({}, "", "/reset-password");
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (active) setError("No hay una sesión válida de recuperación. Solicite un enlace nuevo.");
        return;
      }

      if (active) setReady(true);
    }

    establishRecoverySession();
    return () => { active = false; };
  }, [params]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      setError(passwordUpdateError(updateError.message));
      return;
    }

    await supabase.auth.signOut();
    window.location.assign(`/login?message=${encodeURIComponent("Contraseña actualizada. Inicie sesión con la nueva contraseña.")}`);
  }

  return (
    <form onSubmit={submit} className="login-form">
      <label>
        Nueva contraseña
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={12} required disabled={!ready || saving} />
      </label>
      <label>
        Confirmar contraseña
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={12} required disabled={!ready || saving} />
      </label>
      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {!error && !ready ? <div className="notice-box" role="status">Validando enlace seguro…</div> : null}
      <button className="primary-button" type="submit" disabled={!ready || saving}>{saving ? "Actualizando…" : "Actualizar contraseña"}</button>
    </form>
  );
}
