'use client';

import { useEffect, useRef, useState } from 'react';
import { L as Link } from '@/components/L';
import { useLang } from '@/components/LangProvider';
import { markOutcomeSaved } from '@/lib/assessment/outcome';

/**
 * The registration prompt, over the finished result.
 *
 * ---- what it is ----
 *
 * The platform this replaces raised a two-panel modal the moment the last
 * question was answered: the offer on the left, the form on the right, and a
 * way past it underneath. The client asked for that, so this is that - in this
 * site's own type, colour and controls rather than a copy of the old one.
 *
 * ---- what is different, and deliberately ----
 *
 * The result is already on the page behind it. The old modal was drawn before
 * the score and dismissing it was what revealed the answer; here the answer
 * exists first and this sits over it, so "continue without registering" is a
 * dismissal rather than a toll. That keeps the promise the consent screen
 * makes two minutes earlier - no account needed - while putting the offer at
 * the moment it is worth most.
 *
 * It also only ever appears once, on a freshly earned result. Coming back to
 * a saved result does not raise it again; the quiet panel under the
 * recommendations carries the same offer for anyone who wants it later.
 *
 * ---- the form ----
 *
 * Prefilled from the assessment's own contact question, so the only field
 * that starts empty is the password. The old modal asked for all four again.
 *
 * `<dialog>` rather than a div with a high z-index: it brings the focus trap,
 * Escape, the inert background and the backdrop with it, all of which would
 * otherwise be hand-written and half-right.
 */
export function SaveResultDialog({
  resultId,
  prefill,
  onClose,
}: {
  /** Absent when the response could not be written. The account is still
   *  worth making; it simply starts with nothing attached. */
  resultId?: string;
  prefill: { name: string; email: string; phone: string };
  onClose: () => void;
}) {
  const { t, locale } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    /* showModal makes the rest of the page inert but does not stop it
       scrolling behind the dialog on every engine. */
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Escape and the backdrop both fire `cancel`/`close` on a native dialog;
     routing them through the same handler keeps "dismissed" meaning one
     thing. */
  function dismiss() {
    const el = ref.current;
    if (el?.open) el.close();
    onClose();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') ?? '').trim(),
          email: String(form.get('email') ?? '').trim(),
          phone: String(form.get('phone') ?? '').trim(),
          password: String(form.get('password') ?? ''),
          resultId,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) {
        markOutcomeSaved();
        dismiss();
        /* A full navigation rather than a router push: the dashboard is
           rendered from the session cookie this request has just set, and a
           client-side transition can reuse a tree that was built without it.

           The locale has to be written in. An unprefixed /dashboard is
           resolved by the proxy against the stored choice or the default,
           which would land an English visitor on the Malay dashboard. */
        window.location.assign(`/${locale}/dashboard`);
        return;
      }
      setError(
        {
          BAD_EMAIL: 'up.errEmail',
          TOO_SHORT: 'up.errShort',
          TOO_SIMPLE: 'up.errSimple',
          ACCOUNT_EXISTS: 'keep.errExists',
        }[json.error ?? ''] ?? 'up.errGeneric',
      );
    } catch {
      setError('up.errGeneric');
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      className="gate"
      ref={ref}
      aria-labelledby="gate-h"
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => {
        /* the backdrop is the dialog element itself; the panel inside it
           stops the click from reaching here */
        if (e.target === ref.current) dismiss();
      }}
    >
      <div className="gate-in">
        <button className="gate-x" type="button" onClick={dismiss} aria-label={t('gate.close')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="gate-say">
          <h2 id="gate-h" dangerouslySetInnerHTML={{ __html: t('gate.h') }} />
          <p>{t('gate.p')}</p>
          <ul className="gate-bens">
            {['gate.b1', 'gate.b2', 'gate.b3'].map((k) => (
              <li key={k}>
                <i aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 12.5l5.2 5.2L20 7" />
                  </svg>
                </i>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>

        <form id="gate-form" className="gate-form" onSubmit={onSubmit}>
          <h3>{t('gate.formH')}</h3>

          <div className="wf">
            <label htmlFor="gate-name">{t('keep.fName')}</label>
            <input id="gate-name" name="name" type="text" autoComplete="name"
                   defaultValue={prefill.name} required />
          </div>
          <div className="wf">
            <label htmlFor="gate-email">{t('up.fEmail')}</label>
            <input id="gate-email" name="email" type="email" autoComplete="email"
                   defaultValue={prefill.email} required />
          </div>
          <div className="wf">
            <label htmlFor="gate-phone">{t('keep.fPhone')}</label>
            <input id="gate-phone" name="phone" type="tel" autoComplete="tel"
                   defaultValue={prefill.phone} />
          </div>
          <div className="wf">
            <label htmlFor="gate-pw">{t('keep.fPw')}</label>
            <input id="gate-pw" name="password" type="password" autoComplete="new-password"
                   required minLength={10} aria-describedby="gate-pw-hint" />
            <span id="gate-pw-hint" className="gate-hint">{t('up.pwHint')}</span>
          </div>

          {error ? (
            <p className="gate-err" role="alert">
              {t(error)}{' '}
              {error === 'keep.errExists' ? <Link href="/login">{t('keep.signIn')}</Link> : null}
            </p>
          ) : null}
        </form>

        {/* Both actions live outside the scrolling fields, in a row of their
            own. On a phone the fields are taller than the screen, and putting
            either button at the end of them hid it: first the way out, then -
            once that was pinned - the button it is an alternative to. Neither
            can be scrolled away from here.

            `form="gate-form"` is what keeps the submit button a submit button
            while it sits outside the <form> it belongs to. */}
        <div className="gate-foot">
          <button className="btn btn-solid" type="submit" form="gate-form" disabled={busy}>
            <span>{busy ? t('up.working') : t('gate.cta')}</span> <span className="arw">&#8594;</span>
          </button>
          <button className="gate-skip" type="button" onClick={dismiss}>
            {t('gate.skip')} <span className="arw">&#8594;</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
