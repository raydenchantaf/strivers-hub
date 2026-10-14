'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Sign-in for the admin area, with the site's own accounts. */
export function AdminLogin({ denied }: { denied?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => null);
    if (res?.ok) {
      window.location.reload();
      return;
    }
    setBusy(false);
    setError(res?.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : 'That email and password do not match an account.');
  }

  return (
    <main className="ins-login">
      <div className="ins-login-card">
        <Image src="/img/logo.webp" alt="Strivers' Hub" width={440} height={131} priority className="ins-login-logo" />
        <h1>
          Programme <span className="serif-i">admin</span>
        </h1>
        {denied ? (
          <>
            <p className="ins-login-note">
              You are signed in as <b>{denied}</b>, which does not have admin access. Ask the platform owner to add
              this email to the admin list, or sign in with another account.
            </p>
            <SignOut className="btn btn-ghost" />
          </>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="adm-email">Email</label>
            <input id="adm-email" name="email" type="email" autoComplete="email" required autoFocus />
            <label htmlFor="adm-pw">Password</label>
            <input id="adm-pw" name="password" type="password" autoComplete="current-password" required />
            {error ? (
              <p className="ins-login-err" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn-solid" type="submit" disabled={busy}>
              <span>{busy ? 'Signing in…' : 'Sign in'}</span> <span className="arw">&#8594;</span>
            </button>
          </form>
        )}
        <div className="ins-by">
          <span>Powered by</span>
          <Image src="/img/unbound.webp" alt="UnBound" width={480} height={117} />
        </div>
      </div>
    </main>
  );
}

export function SignOut({ className = 'ins-out' }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
        window.location.reload();
      }}
    >
      Sign out
    </button>
  );
}

/**
 * Erasing a person's data: the email has to be typed again, and the server
 * checks the same thing, so it cannot happen by a stray click.
 */
export function EraseForm({ email }: { email: string }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function erase() {
    setBusy(true);
    const res = await fetch('/api/admin/person', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, confirm: typed }),
    }).catch(() => null);
    const j = (await res?.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      removed?: { account: number; assessments: number; mentorship: number; resets: number };
    };
    setBusy(false);
    if (j?.ok && j.removed) {
      const r = j.removed;
      setResult(
        `Erased: ${r.account ? 'the account, ' : ''}${r.assessments} assessment(s), ${r.mentorship} mentorship sign-up(s) and ${r.resets} reset link(s). This has been recorded in the audit log.`,
      );
      return;
    }
    setResult(
      j?.error === 'SELF' ? 'You cannot erase your own admin account from here.' : j?.error === 'CONFIRM' ? 'The email you typed does not match.' : 'That did not work. Nothing was erased.',
    );
  }

  if (result?.startsWith('Erased')) return <p className="adm-done" role="status">{result}</p>;
  return (
    <div className="adm-danger">
      <h3>Erase everything held about {email}</h3>
      <p>
        For a request to delete their data. This removes the account, every assessment linked to it or carrying this
        email, mentorship sign-ups and reset links. It cannot be undone.
      </p>
      <label htmlFor="adm-confirm">Type the email address to confirm</label>
      <div className="adm-row">
        <input id="adm-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={email} autoComplete="off" />
        <button className="btn adm-btn-danger" type="button" disabled={busy || typed.trim().toLowerCase() !== email} onClick={erase}>
          {busy ? 'Erasing…' : 'Erase permanently'}
        </button>
      </div>
      {result ? <p className="ins-login-err" role="alert">{result}</p> : null}
    </div>
  );
}
