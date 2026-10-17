'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { L as Link } from '@/components/L';
import { useLang } from './LangProvider';

/**
 * Cookie choice for Google Analytics.
 *
 * The privacy policy tells visitors they may decline non-essential cookies.
 * Google Analytics is the only thing on the site that sets one: the sign-in
 * and language cookies are needed for the site to work, and the site's own
 * analytics sets no cookie at all. So the choice is one question, asked once.
 *
 * Off unless NEXT_PUBLIC_COOKIE_NOTICE=1. Off, Google Analytics loads as it
 * always has. On, it loads only after the visitor agrees, and "Cookie
 * settings" in the footer lets them change their mind.
 */

export const ASK = process.env.NEXT_PUBLIC_COOKIE_NOTICE === '1';

const COOKIE = 'sh_consent';
const KEEP = 60 * 60 * 24 * 180; // six months, then ask again
const CHANGED = 'sh-consent';
const REOPEN = 'sh-consent-open';

type Choice = 'yes' | 'no' | null;

function readChoice(): Choice {
  const m = document.cookie.match(/(?:^|;\s*)sh_consent=(yes|no)/);
  return m ? (m[1] as 'yes' | 'no') : null;
}

function saveChoice(choice: 'yes' | 'no') {
  document.cookie = `${COOKIE}=${choice};path=/;max-age=${KEEP};samesite=lax`;
  window.dispatchEvent(new CustomEvent(CHANGED, { detail: choice }));
}

/** Google's own cookies, removed when someone takes their agreement back. */
function dropGaCookies() {
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.replace(/^www\./, '')}`];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (name !== '_ga' && !name.startsWith('_ga_')) continue;
    for (const d of domains) {
      document.cookie = `${name}=;path=/;max-age=0${d ? `;domain=${d}` : ''}`;
    }
  }
}

/** The gtag snippet. Rendered at once when not asking, after a yes when asking. */
export function GoogleAnalytics({ id }: { id: string }) {
  const [on, setOn] = useState(!ASK);

  useEffect(() => {
    if (!ASK) return;
    const apply = (choice: Choice) => {
      if (choice === 'yes') {
        (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = false;
        setOn(true);
      } else if (choice === 'no') {
        /* Google's documented switch: a loaded gtag stops sending */
        (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = true;
        dropGaCookies();
      }
    };
    apply(readChoice());
    const onChange = (e: Event) => apply((e as CustomEvent<Choice>).detail);
    window.addEventListener(CHANGED, onChange);
    return () => window.removeEventListener(CHANGED, onChange);
  }, [id]);

  if (!on) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      {/* not inside a frame: the heatmap on /insights previews pages in one,
          and those previews are not visits */}
      <Script id="ga" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());if(window.top===window.self){gtag('config','${id}',{anonymize_ip:true});}`}
      </Script>
    </>
  );
}

/** The question itself, bottom left, until it is answered. */
export function CookieNotice() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ASK || !process.env.NEXT_PUBLIC_GA_ID) return;
    /* the heatmap's page previews are not visitors */
    if (window.top !== window.self) return;
    if (readChoice() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(REOPEN, reopen);
    return () => window.removeEventListener(REOPEN, reopen);
  }, []);

  if (!open) return null;
  const answer = (choice: 'yes' | 'no') => {
    saveChoice(choice);
    setOpen(false);
  };
  return (
    <div className="ck" role="dialog" aria-live="polite" aria-label={t('ck.label')}>
      <p>
        {t('ck.text')} <Link href="/privacy-policy">{t('ck.more')}</Link>
      </p>
      <div className="ck-acts">
        <button type="button" className="btn btn-solid btn-sm" onClick={() => answer('yes')}>
          {t('ck.yes')}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => answer('no')}>
          {t('ck.no')}
        </button>
      </div>
    </div>
  );
}

/** "Cookie settings" in the footer, so a choice can be changed later. */
export function CookieSettingsLink() {
  const { t } = useLang();
  if (!ASK || !process.env.NEXT_PUBLIC_GA_ID) return null;
  return (
    <button type="button" className="foot-ck" onClick={() => window.dispatchEvent(new Event(REOPEN))}>
      {t('ck.settings')}
    </button>
  );
}
