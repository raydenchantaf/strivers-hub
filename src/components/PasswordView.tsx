'use client';

import { L as Link } from '@/components/L';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { HeaderField } from './HeaderField';
import { useLang } from './LangProvider';

type Mode = 'forgot' | 'reset';

const ERRORS: Record<string, string> = {
  BAD_EMAIL: 'up.errEmail',
  TOO_SHORT: 'up.errShort',
  TOO_SIMPLE: 'up.errSimple',
  BAD_TOKEN: 'pw.errToken',
  EXPIRED: 'pw.errToken',
  TOO_MANY: 'up.errTooMany',
};

/**
 * Both halves of the reset flow, which are the same form with a different
 * field in it: ask for the address, then choose the new password.
 *
 * The request step reports the same thing whether or not the address has an
 * account, matching the API - otherwise the form answers the question "does
 * this person have an account here", which is not ours to answer.
 */
export function PasswordView({ mode }: { mode: Mode }) {
  const { t, lang, locale } = useLang();
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReset = mode === 'reset';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(isReset ? '/api/auth/reset' : '/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isReset ? { ...data, token } : { ...data, lang }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) {
        if (isReset) {
          router.push(`/${locale}/dashboard`);
          router.refresh();
        } else {
          setSent(true);
        }
        return;
      }
      setError(ERRORS[json.error ?? ''] ?? 'up.errGeneric');
    } catch {
      setError('up.errGeneric');
    } finally {
      setBusy(false);
    }
  }

  /* A reset page reached without a token is not an error the visitor caused,
     so it explains itself and offers the way back rather than a dead form. */
  const noToken = isReset && !token;

  return (
    <header className="phead" style={{ paddingBottom: 'clamp(64px,7vw,104px)' }}>
      <HeaderField />
      <div className="shell">
        <div className="auth-solo">
          <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
            {t('pw.eyebrow')}
          </span>
          <h1 className="ld ld-2">{t(isReset ? 'pw.resetH' : 'pw.forgotH')}</h1>
          <p className="lede ld ld-3">{t(isReset ? 'pw.resetLede' : 'pw.forgotLede')}</p>

          <div className="wpanel ld ld-4">
            {noToken ? (
              <>
                <p className="wnote" role="alert" style={{ textAlign: 'left', margin: 0 }}>
                  {t('pw.errToken')}
                </p>
                <Link className="btn btn-solid" href="/forgot-password" style={{ marginTop: 18 }}>
                  <span>{t('pw.again')}</span> <span className="arw">&#8594;</span>
                </Link>
              </>
            ) : sent ? (
              <>
                <p className="wdone" role="status">
                  {t('pw.sent')}
                </p>
                <p className="wnote" style={{ textAlign: 'left' }}>
                  {t('pw.sentNote')}
                </p>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="wgrid" style={{ marginTop: 0 }}>
                  {isReset ? (
                    <div className="wf wide">
                      <label htmlFor="pw1">
                        <span>{t('pw.fNew')}</span> <i>*</i>
                      </label>
                      <input
                        id="pw1"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={10}
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        aria-describedby="pw-hint"
                      />
                      <span
                        id="pw-hint"
                        className="wnote"
                        style={{ textAlign: 'left', margin: '4px 0 0' }}
                      >
                        {t('up.pwHint')}
                      </span>
                    </div>
                  ) : (
                    <div className="wf wide">
                      <label htmlFor="pw0">
                        <span>{t('up.fEmail')}</span> <i>*</i>
                      </label>
                      <input
                        id="pw0"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="nurul@perniagaan.com"
                      />
                    </div>
                  )}
                </div>

                <button className="btn btn-solid" type="submit" disabled={busy}>
                  <span>{busy ? t('up.working') : t(isReset ? 'pw.save' : 'pw.send')}</span>{' '}
                  <span className="arw">&#8594;</span>
                </button>

                {error ? (
                  <p className="wnote" role="alert" style={{ color: 'var(--magenta)' }}>
                    {t(error)}
                  </p>
                ) : null}
              </form>
            )}

            <p className="auth-back">
              <Link href="/login">&#8592; {t('pw.back')}</Link>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
