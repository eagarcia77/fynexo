import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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
          <button className="primary-button" type="submit">Iniciar sesión</button>
        </form>
        <p className="tiny">Budget • Procure • Control • Analyze</p>
      </section>
    </main>
  );
}
