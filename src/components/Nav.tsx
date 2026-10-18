'use client';

import Image from 'next/image';
import { L as Link } from '@/components/L';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AUTH_CHANGED, authChanged, signedInHint } from '@/lib/auth/client';
import { dict } from '@/lib/i18n/dict';
import { HTML_LANG, LANGS, LANG_TO_LOCALE, swapLocale, type Lang } from '@/lib/i18n/types';
import { useLang } from './LangProvider';

const LINKS = [
  { href: '/assessment', key: 'nav.assess', icon: 'assess' },
  { href: '/resources', key: 'nav.res', icon: 'res' },
  { href: '/financing', key: 'nav.fin', icon: 'fin' },
  { href: '/events', key: 'nav.events', icon: 'events' },
  { href: '/mentorship', key: 'nav.mentor', icon: 'mentor' },
  { href: '/about', key: 'nav.about', icon: 'about' },
] as const;

/**
 * Links, not buttons. Each language has its own URL now, so the switch is a
 * navigation: a crawler can follow it to find the other half of the site, and
 * a reader can open it in a new tab. The cookie is still written, so the next
 * unprefixed URL they arrive on remembers the choice.
 */
function LangSwitch() {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  return (
    <span className="lang" role="group" aria-label={t('nav.lang')}>
      {LANGS.map((l: Lang) => (
        <NextLink
          key={l}
          href={swapLocale(pathname, LANG_TO_LOCALE[l])}
          hrefLang={HTML_LANG[l]}
          className={l === lang ? 'on' : undefined}
          aria-current={l === lang ? 'true' : undefined}
          onClick={() => setLang(l)}
        >
          {l === 'bm' ? 'BM' : 'EN'}
        </NextLink>
      ))}
    </span>
  );
}

/**
 * A label that reserves the width of the longer language.
 *
 * Both translations sit in the same grid cell; the inactive one keeps its box
 * but is hidden with `visibility`, so it is out of the accessibility tree and
 * unclickable while still holding the column open. The row therefore has the
 * same geometry in both languages, from the first paint, with no measuring
 * and no dependency on the webfont having loaded.
 */
function Lock({ k }: { k: string }) {
  const { lang } = useLang();
  return (
    <span className="lockw">
      {LANGS.map((l) => (
        <span key={l} className={l === lang ? undefined : 'lock-off'}>
          {dict[k]?.[l] ?? k}
        </span>
      ))}
    </span>
  );
}

const NAME_KEY = 'sh_me';

/**
 * The signed-in member, for the header: their name once known, else null.
 *
 * Whether to show the member's controls at all is decided before paint, by
 * the hint script and CSS on `html[data-auth]`, so nothing flashes. This only
 * fills in the name (kept for the tab in sessionStorage, so later pages don't
 * wait for it), and re-checks after every navigation, since signing in and
 * out both end in one, and whenever a form signs someone in or out in place.
 */
function useMember() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener(AUTH_CHANGED, bump);
    return () => window.removeEventListener(AUTH_CHANGED, bump);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const forget = () => {
      root.removeAttribute('data-auth');
      setName(null);
      try {
        sessionStorage.removeItem(NAME_KEY);
      } catch {
        /* storage blocked: nothing to forget */
      }
    };
    if (!signedInHint()) return forget();

    root.setAttribute('data-auth', 'in');
    try {
      const kept = sessionStorage.getItem(NAME_KEY);
      if (kept) setName(kept);
    } catch {
      /* storage blocked: wait for the request */
    }
    let gone = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((me: { signedIn: boolean; name?: string }) => {
        if (gone) return;
        if (!me.signedIn) return forget();
        const n = me.name ?? '';
        setName(n);
        try {
          sessionStorage.setItem(NAME_KEY, n);
        } catch {
          /* fine */
        }
      })
      .catch(() => {
        /* offline: keep what is shown */
      });
    return () => {
      gone = true;
    };
  }, [pathname, tick]);

  return name;
}

export function Nav() {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const member = useMember();
  const first = member?.trim().split(/\s+/)[0] ?? '';
  /* until the name arrives, the button says where it goes */
  const hello = first ? `${t('nav.hi')} ${first}` : t('nav.me');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    authChanged();
    router.push(`/${LANG_TO_LOCALE[lang]}`);
    router.refresh();
  }

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isOn = useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  return (
    <>
      <nav className="nav">
        <div className="shell nav-in">
          {/* The platform's own mark, on its own. The builder's credit lives
              at the foot of the page (Footer), as TAF asked. */}
          <div className="nav-brand">
            <Link className="nav-logo" href="/" aria-label={t('nav.home')}>
              <Image src="/img/logo.webp" alt="Strivers' Hub" width={316} height={94} priority />
            </Link>
          </div>

          <div className="nav-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={isOn(l.href) ? 'on' : undefined}>
                <Lock k={l.key} />
              </Link>
            ))}
          </div>

          <div className="nav-right">
            <LangSwitch />
            {/* Each slot holds the signed-out and the signed-in button in one
                grid cell, so switching between them moves nothing. The name
                button takes the width of Join Us and trims a long name with
                an ellipsis rather than widening the slot. */}
            <span className="nslot nav-login">
              <Link className="btn btn-ghost btn-sm g-only" href="/login">
                <Lock k="nav.login" />
              </Link>
              <button className="btn btn-ghost btn-sm m-only" type="button" onClick={logout}>
                <Lock k="db.logout" />
              </button>
            </span>
            <span className="nslot nav-cta">
              <Link className="btn btn-solid btn-sm g-only" href="/register">
                <Lock k="nav.join" />
              </Link>
              <Link
                className="btn btn-solid btn-sm m-only nav-me"
                href="/dashboard"
                title={t('nav.me')}
                aria-label={member ? `${t('nav.me')}: ${member}` : t('nav.me')}
              >
                <span className="nav-me-t">{hello}</span>
              </Link>
            </span>
            <button
              className="burger"
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={t('nav.menu')}
              onClick={() => setOpen((v) => !v)}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`scrim${open ? ' on' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`msheet${open ? ' on' : ''}`}
        id="mobile-menu"
        role="dialog"
        aria-modal={open}
        aria-label={t('nav.menu')}
      >
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link className={`mrow${isOn(l.href) ? ' on' : ''}`} href={l.href}>
                <span className="mi">
                  <svg viewBox="0 0 20 22" aria-hidden="true">
                    <use href={`#i-${l.icon}`} />
                  </svg>
                </span>
                <span>{t(l.key)}</span>
                <span className="chev" aria-hidden="true">
                  &#8250;
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="msep" />
        <div className="mlang">
          <span>{t('nav.lang')}</span>
          <LangSwitch />
        </div>
        <div className="msep" />
        <div className="mfoot">
          <Link className="btn btn-ghost mg" href="/login">
            {t('nav.login')}
          </Link>
          <Link className="btn btn-solid mg" href="/register">
            {t('nav.join')}
          </Link>
          <Link className="btn btn-solid mm" href="/dashboard">
            {first ? `${t('nav.hi')} ${first}` : t('db.eyebrow')}
          </Link>
          <button className="btn btn-ghost mm" type="button" onClick={logout}>
            {t('db.logout')}
          </button>
        </div>
      </div>
    </>
  );
}
