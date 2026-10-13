'use client';

import { L as Link } from '@/components/L';
import { useState } from 'react';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { formatDate } from '@/lib/content-format';

const ERRORS: Record<string, string> = {
  INVALID: 'pr.errCurrent',
  TOO_SHORT: 'up.errShort',
  TOO_SIMPLE: 'up.errSimple',
};

export type ProfileData = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt?: string;
  score: number | null;
  band: string | null;
  takenAt: string | null;
};

/**
 * The account page: what we hold, and the one thing the visitor can change
 * here. Editing name and phone is deliberately not offered - they are
 * collected once at registration and again by the assessment, and a second
 * writable copy would just disagree with the first.
 */
export function ProfileView({ data }: { data: ProfileData }) {
  const { t, lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) {
        form.reset();
        setDone(true);
        return;
      }
      setError(ERRORS[json.error ?? ''] ?? 'up.errGeneric');
    } catch {
      setError('up.errGeneric');
    } finally {
      setBusy(false);
    }
  }

  const name = [data.firstName, data.lastName].filter(Boolean).join(' ');

  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(30px,3.6vw,46px)' }}>
        <HeaderField />
        <div className="shell">
          <div className="phead-grid">
            <div>
              <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
                {t('pr.eyebrow')}
              </span>
              <h1 className="ld ld-2">{t('pr.h1')}</h1>
              <p className="lede ld ld-3">{t('pr.lede')}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 'clamp(22px,2.6vw,34px)' }}>
        <div className="shell">
          <div className="pro">
            <div className="pro-card">
              <h2>{t('pr.detailsH')}</h2>
              <p>{t('pr.detailsP')}</p>
              <dl className="pro-rows">
                <div className="pro-row">
                  <dt>{t('pr.fName')}</dt>
                  <dd>{name || '—'}</dd>
                </div>
                <div className="pro-row">
                  <dt>{t('up.fEmail')}</dt>
                  <dd>{data.email}</dd>
                </div>
                {data.phone ? (
                  <div className="pro-row">
                    <dt>{t('pr.fPhone')}</dt>
                    <dd>{data.phone}</dd>
                  </div>
                ) : null}
                {data.createdAt ? (
                  <div className="pro-row">
                    <dt>{t('pr.fJoined')}</dt>
                    <dd>{formatDate(data.createdAt, lang)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="pro-card">
              <h2>{t('pr.assessH')}</h2>
              <p>{t('pr.assessP')}</p>
              {data.score !== null ? (
                <>
                  <dl className="pro-rows">
                    <div className="pro-row">
                      <dt>{t('pr.fScore')}</dt>
                      <dd>{data.score} / 18</dd>
                    </div>
                    {data.band ? (
                      <div className="pro-row">
                        <dt>{t('pr.fBand')}</dt>
                        <dd>{data.band}</dd>
                      </div>
                    ) : null}
                    {data.takenAt ? (
                      <div className="pro-row">
                        <dt>{t('pr.fTaken')}</dt>
                        <dd>{formatDate(data.takenAt, lang)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <Link className="btn btn-ghost btn-sm" href="/results">
                    <span>{t('pr.viewResult')}</span> <span className="arw">&#8594;</span>
                  </Link>
                </>
              ) : (
                <Link className="btn btn-solid btn-sm" href="/assessment">
                  <span>{t('pr.takeIt')}</span> <span className="arw">&#8594;</span>
                </Link>
              )}
            </div>

            <div className="pro-card">
              <h2>{t('pr.pwH')}</h2>
              <p>{t('pr.pwP')}</p>
              <form onSubmit={onSubmit}>
                <div className="wgrid" style={{ marginTop: 0 }}>
                  <div className="wf wide">
                    <label htmlFor="pr1">
                      <span>{t('pr.fCurrent')}</span> <i>*</i>
                    </label>
                    <input
                      id="pr1"
                      name="current"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    />
                  </div>
                  <div className="wf wide">
                    <label htmlFor="pr2">
                      <span>{t('pw.fNew')}</span> <i>*</i>
                    </label>
                    <input
                      id="pr2"
                      name="next"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={10}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      aria-describedby="pr-hint"
                    />
                    <span
                      id="pr-hint"
                      className="wnote"
                      style={{ textAlign: 'left', margin: '4px 0 0' }}
                    >
                      {t('up.pwHint')}
                    </span>
                  </div>
                </div>
                <button className="btn btn-solid btn-sm" type="submit" disabled={busy}>
                  <span>{busy ? t('up.working') : t('pr.pwSave')}</span>{' '}
                  <span className="arw">&#8594;</span>
                </button>
                {error ? (
                  <p className="wnote" role="alert" style={{ color: 'var(--magenta)', textAlign: 'left' }}>
                    {t(error)}
                  </p>
                ) : done ? (
                  <p className="wnote" role="status" style={{ textAlign: 'left' }}>
                    {t('pr.pwDone')}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
