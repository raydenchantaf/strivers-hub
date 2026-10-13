'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { dict } from '@/lib/i18n/dict';
import {
  DEFAULT_LANG,
  HTML_LANG,
  LANG_COOKIE,
  LANG_TO_LOCALE,
  LOCALE_TO_LANG,
  swapLocale,
  type Lang,
  type Locale,
  type Localised,
} from '@/lib/i18n/types';

type Ctx = {
  lang: Lang;
  locale: Locale;
  setLang: (lang: Lang) => void;
  /** Translate a key. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Pick one language out of a bilingual value from the CMS. */
  p: (value: Localised | null | undefined) => string;
};

const LangContext = createContext<Ctx | null>(null);

/**
 * The language is the URL. Switching is a navigation, not a state change.
 *
 * That is the whole point of locale routing: the two languages have two
 * addresses, so each can be linked, shared and indexed on its own. The cookie
 * survives only to remember the choice for the next unprefixed URL someone
 * arrives on - the middleware reads it and nothing else does.
 */
export function LangProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const lang = LOCALE_TO_LANG[locale];

  const setLang = useCallback(
    (next: Lang) => {
      // one year, site-wide, no personal data
      document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      router.push(swapLocale(pathname, LANG_TO_LOCALE[next]));
    },
    [pathname, router],
  );

  /* The served HTML already carries the right lang; this keeps it right after
     a client-side navigation between locales. */
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      locale,
      setLang,
      t: (key, vars) => {
        const entry = dict[key];
        let out = entry ? entry[lang] ?? entry[DEFAULT_LANG] : key;
        if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
        return out;
      },
      p: (v) => (v ? v[lang] || v.en || v.bm || '' : ''),
    }),
    [lang, locale, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

/** Translated text. Pass `html` for the handful of strings carrying markup. */
export function T({
  k,
  html,
  vars,
}: {
  k: string;
  html?: boolean;
  vars?: Record<string, string | number>;
}) {
  const { t } = useLang();
  const value = t(k, vars);
  if (html) return <span dangerouslySetInnerHTML={{ __html: value }} />;
  return <>{value}</>;
}
