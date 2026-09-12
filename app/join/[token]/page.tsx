import Link from "next/link";
import { joinWithExistingAccount, joinWithNewAccount } from "./actions";

export default async function JoinPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const { token } = await params;
  const messages = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-panel wide-login" aria-labelledby="join-title">
        <div className="brand-mark" aria-hidden="true">FX</div>
        <p className="eyebrow">FYNEXO · Acceso por invitación</p>
        <h1 id="join-title">Únase a FYNEXO</h1>
        <p className="muted">La invitación está vinculada a un correo, una organización y un rol. No comparta este enlace.</p>
        {messages.error ? <div className="error-box" role="alert">{messages.error}</div> : null}
        {messages.message ? <div className="success-box" role="status">{messages.message}</div> : null}
        <div className="join-grid">
          <section>
            <h2>Crear cuenta</h2>
            <form action={joinWithNewAccount} className="login-form">
              <input type="hidden" name="token" value={token} />
              <label>Nombre completo<input name="fullName" autoComplete="name" required /></label>
              <label>Correo invitado<input name="email" type="email" autoComplete="email" required /></label>
              <label>Contraseña nueva<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
              <button className="primary-button" type="submit">Crear cuenta y continuar</button>
            </form>
          </section>
          <section>
            <h2>Ya tengo cuenta</h2>
            <form action={joinWithExistingAccount} className="login-form">
              <input type="hidden" name="token" value={token} />
              <label>Nombre completo<input name="fullName" autoComplete="name" /></label>
              <label>Correo invitado<input name="email" type="email" autoComplete="email" required /></label>
              <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
              <button className="secondary-button" type="submit">Acceder y aceptar invitación</button>
            </form>
          </section>
        </div>
        <p className="tiny"><Link href="/login">Volver al inicio de sesión</Link></p>
      </section>
    </main>
  );
}
