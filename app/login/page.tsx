import Link from "next/link";
import { requestPasswordReset, signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">FX</div>
        <p className="eyebrow">Financial Operations & Procurement Intelligence</p>
        <h1 id="login-title">FYNEXO</h1>
        <p className="muted">Conecta. Controla. Decide.</p>

        <form action={signIn} className="login-form">
          <label>
            Correo electrónico
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
          {params.message ? <div className="success-box" role="status">{params.message}</div> : null}
          <button className="primary-button" type="submit">Iniciar sesión</button>
        </form>

        <details>
          <summary>¿Olvidó su contraseña?</summary>
          <form action={requestPasswordReset} className="login-form compact-form">
            <label>
              Correo de la cuenta
              <input type="email" name="resetEmail" autoComplete="email" placeholder="nombre@correo.com" required />
            </label>
            <button className="secondary-button" type="submit">Enviar enlace de recuperación</button>
          </form>
          <p className="tiny">Si el botón del correo no abre, copie el enlace y use la recuperación alternativa.</p>
          <Link className="secondary-button" href="/recover-link">El enlace del correo no abre</Link>
        </details>

        <p className="tiny">Budget • Procure • Control • Analyze</p>
      </section>
    </main>
  );
}
