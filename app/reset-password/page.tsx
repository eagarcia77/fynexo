import { updatePassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="reset-title">
        <div className="brand-mark" aria-hidden="true">FX</div>
        <p className="eyebrow">Recuperación de acceso</p>
        <h1 id="reset-title">Nueva contraseña</h1>
        <p className="muted">Defina una contraseña nueva para su cuenta FYNEXO.</p>
        <form action={updatePassword} className="login-form">
          <label>
            Nueva contraseña
            <input type="password" name="password" autoComplete="new-password" minLength={12} required />
          </label>
          <label>
            Confirmar contraseña
            <input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} required />
          </label>
          {params.error ? <div className="error-box" role="alert">{params.error}</div> : null}
          <button className="primary-button" type="submit">Actualizar contraseña</button>
        </form>
      </section>
    </main>
  );
}
