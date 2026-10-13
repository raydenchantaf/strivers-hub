'use client';

import { L as Link } from '@/components/L';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HeaderField } from './HeaderField';
import { useLang } from './LangProvider';

type Mode = 'in' | 'up';

const ERRORS: Record<string, string> = {
  INVALID: 'up.errInvalid',
  ACCOUNT_EXISTS: 'up.errExists',
  BAD_EMAIL: 'up.errEmail',
  TOO_SHORT: 'up.errShort',
  TOO_SIMPLE: 'up.errSimple',
};

export function AuthView({ mode }: { mode: Mode }) {
  const { t, locale } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUp = mode === 'up';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(isUp ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) {
        router.push(`/${locale}/dashboard`);
        router.refresh();
        return;
      }
      setError(ERRORS[json.error ?? ''] ?? 'up.errGeneric');
    } catch {
      setError('up.errGeneric');
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="phead" style={{ paddingBottom: 'clamp(64px,7vw,104px)' }}>
      <HeaderField />
      <div className="shell">
        <div className="auth">
          <div className="auth-say">
            <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
              {t('up.eyebrow')}
            </span>
            <h1 className="ld ld-2" dangerouslySetInnerHTML={{ __html: t('up.h1') }} />
            <p className="ld ld-3">{t('up.lede')}</p>
            <ul className="auth-list ld ld-4">
              {['up.l1', 'up.l2', 'up.l3'].map((k) => (
                <li key={k}>
                  <i aria-hidden="true" />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </div>

          <form className="wpanel ld ld-4" onSubmit={onSubmit}>
            <div className="atabs" role="tablist">
              <Link
                href="/login"
                role="tab"
                aria-selected={!isUp}
                className={`atab${!isUp ? ' on' : ''}`}
              >
                {t('up.tabIn')}
              </Link>
              <Link
                href="/register"
                role="tab"
                aria-selected={isUp}
                className={`atab${isUp ? ' on' : ''}`}
              >
                {t('up.tabUp')}
              </Link>
            </div>

            <div className="wgrid" style={{ marginTop: 0 }}>
              {isUp ? (
                <div className="wf wide">
                  <label htmlFor="au0">
                    <span>{t('up.fName')}</span> <i>*</i>
                  </label>
                  <input
                    id="au0"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Nurul Rahman"
                  />
                </div>
              ) : null}
              <div className="wf wide">
                <label htmlFor="au1">
                  <span>{t('up.fEmail')}</span> <i>*</i>
                </label>
                <input
                  id="au1"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nurul@perniagaan.com"
                />
              </div>
              <div className="wf wide">
                <label htmlFor="au2">
                  <span>{t('up.fPass')}</span> <i>*</i>
                </label>
                <input
                  id="au2"
                  name="password"
                  type="password"
                  autoComplete={isUp ? 'new-password' : 'current-password'}
                  required
                  minLength={isUp ? 10 : undefined}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  aria-describedby={isUp ? 'pw-hint' : undefined}
                />
                {isUp ? (
                  <span id="pw-hint" className="wnote" style={{ textAlign: 'left', margin: '4px 0 0' }}>
                    {t('up.pwHint')}
                  </span>
                ) : (
                  <Link className="auth-forgot" href="/forgot-password">
                    {t('up.forgot')}
                  </Link>
                )}
              </div>
            </div>

            <button className="btn btn-solid" type="submit" disabled={busy}>
              <span>{busy ? t('up.working') : t(isUp ? 'up.tabUp' : 'up.tabIn')}</span>{' '}
              <span className="arw">&#8594;</span>
            </button>

            {error ? (
              <p className="wnote" role="alert" style={{ color: 'var(--magenta)' }}>
                {t(error)}
              </p>
            ) : (
              <p className="wnote">{t('up.legal')}</p>
            )}
          </form>
        </div>
      </div>
    </header>
  );
}
