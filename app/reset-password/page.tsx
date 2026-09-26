import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="reset-title">
        <div className="brand-mark" aria-hidden="true"><img src="/fynexo-mark.svg" alt="" /></div>
        <p className="eyebrow">Recuperación de acceso</p>
        <h1 id="reset-title">Nueva contraseña</h1>
        <p className="muted">Defina una contraseña nueva para su cuenta FYNEXO.</p>
        <Suspense fallback={<div className="notice-box" role="status">Validando enlace seguro…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
