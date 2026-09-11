import { bootstrapAdmin, signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const bootstrapEnabled = Boolean(process.env.FYNEXO_BOOTSTRAP_CODE && process.env.FYNEXO_ADMIN_EMAIL);

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

        {bootstrapEnabled ? (
          <details className="bootstrap-panel">
            <summary>Inicializar administrador</summary>
            <form action={bootstrapAdmin} className="login-form bootstrap-form">
              <p className="tiny">Disponible únicamente para la configuración inicial autorizada.</p>
              <label>
                Nombre completo
                <input type="text" name="fullName" autoComplete="name" required />
              </label>
              <label>
                Correo autorizado
                <input type="email" name="email" autoComplete="email" required />
              </label>
              <label>
                Contraseña nueva
                <input type="password" name="password" autoComplete="new-password" minLength={12} required />
              </label>
              <label>
                Código de inicialización
                <input type="password" name="bootstrapCode" autoComplete="off" required />
              </label>
              <button className="secondary-button" type="submit">Crear administrador inicial</button>
            </form>
          </details>
        ) : null}

        <p className="tiny">Budget • Procure • Control • Analyze</p>
      </section>
    </main>
  );
}
