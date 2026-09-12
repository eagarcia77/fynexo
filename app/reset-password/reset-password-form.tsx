"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      setError(updateError.message);
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
