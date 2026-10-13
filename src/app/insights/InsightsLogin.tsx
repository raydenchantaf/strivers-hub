'use client';

import Image from 'next/image';
import { useState } from 'react';

export function InsightsLogin({ unconfigured = false }: { unconfigured?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const password = String(new FormData(e.currentTarget).get('password') ?? '');
    const res = await fetch('/api/insights/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) {
      window.location.reload();
      return;
    }
    setBusy(false);
    setError(
      res?.status === 429
        ? 'Too many tries. Wait ten minutes and try again.'
        : res?.status === 503
          ? 'The dashboard is not set up on this server yet.'
          : 'That password is not right.',
    );
  }

  return (
    <main className="ins-login">
      <div className="ins-login-card">
        <Image src="/img/logo.webp" alt="Strivers' Hub" width={440} height={131} priority className="ins-login-logo" />
        <h1>
          Insights <span className="serif-i">dashboard</span>
        </h1>
        {unconfigured ? (
          <p className="ins-login-note">
            Set <code>INSIGHTS_PASSWORD</code> and <code>AUTH_SECRET</code> on the server to open the dashboard.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="ins-pw">Password</label>
            <input id="ins-pw" name="password" type="password" autoComplete="current-password" required autoFocus />
            {error ? (
              <p className="ins-login-err" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn-solid" type="submit" disabled={busy}>
              <span>{busy ? 'Opening…' : 'Open the dashboard'}</span> <span className="arw">&#8594;</span>
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
