import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from './types';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.strivershub.com';

/** Put a locale on a site-relative path. Anything else is returned as it is. */
export function localised(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

/** The locale a path is in, for code that only has the pathname. */
export function localeOf(pathname: string): Locale {
  const first = pathname.split('/')[1] ?? '';
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

/**
 * Canonical and hreflang for one page, in both locales.
 *
 * Every translated page has to point at its own canonical and list its
 * sibling, or the two versions compete for the same ranking and the crawler
 * picks one - which is the state the live platform is in, where a single URL
 * serves both languages and only one can ever be indexed.
 *
 * `x-default` names the Malay page: the audience is Malaysian, so that is
 * where a visitor with no matching language preference should land.
 */
export function alternates(path: string, locale: Locale) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l === 'ms' ? 'ms-MY' : 'en-MY'] = `${base}${localised(path, l)}`;
  }
  languages['x-default'] = `${base}${localised(path, DEFAULT_LOCALE)}`;
  return { canonical: `${base}${localised(path, locale)}`, languages };
}
