"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const allowedHosts = new Set([
  "ibvzibenuusninpmpkpm.supabase.co",
  "fynexo.onrender.com",
]);

const canonicalRecovery = "https://fynexo.onrender.com/auth/callback?next=/reset-password";

function normalizeRecoveryUrl(url: URL) {
  if (!allowedHosts.has(url.hostname)) {
    throw new Error("El enlace no corresponde a un enlace seguro de recuperación de FYNEXO.");
  }

  if (url.hostname === "ibvzibenuusninpmpkpm.supabase.co" && url.pathname === "/auth/v1/verify") {
    const redirectTo = url.searchParams.get("redirect_to");
    if (!redirectTo || redirectTo.includes("localhost") || redirectTo.includes("127.0.0.1")) {
      url.searchParams.set("redirect_to", canonicalRecovery);
    }
  }

  return url.toString();
}

function extractSafeTarget(raw: string) {
  const first = new URL(raw.trim());
  if (allowedHosts.has(first.hostname)) return normalizeRecoveryUrl(first);

  // Microsoft Safe Links often wrap the real destination in ?url=...
  const nested = first.searchParams.get("url");
  if (nested) {
    const decoded = new URL(nested);
    return normalizeRecoveryUrl(decoded);
  }

  throw new Error("El enlace no corresponde a un enlace seguro de recuperación de FYNEXO.");
}

export default function RecoverLinkPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const target = extractSafeTarget(value);
      window.location.assign(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : "El enlace no es válido.");
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="recover-link-title">
        <div className="brand-mark" aria-hidden="true">FX</div>
        <p className="eyebrow">Recuperación alternativa</p>
        <h1 id="recover-link-title">Abrir enlace de recuperación</h1>
        <p className="muted">
          Si el botón del correo no abre, manténgalo presionado, copie el enlace completo y péguelo aquí. Si el correo contiene una redirección antigua a localhost, FYNEXO la corregirá automáticamente hacia el servidor de producción.
        </p>
        <form onSubmit={openRecovery} className="login-form">
          <label>
            Enlace del correo
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={5}
              placeholder="https://..."
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </label>
          {error ? <div className="error-box" role="alert">{error}</div> : null}
          <button className="primary-button" type="submit">Corregir y abrir enlace</button>
        </form>
        <p className="tiny">FYNEXO solo aceptará enlaces del proyecto Supabase o de fynexo.onrender.com.</p>
        <div className="form-actions top-gap"><Link className="secondary-button" href="/login">Volver al inicio de sesión</Link></div>
      </section>
    </main>
  );
}
