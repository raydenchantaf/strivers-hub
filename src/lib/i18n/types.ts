export type Lang = 'en' | 'bm';

/** Every translatable string on the site carries both languages. */
export type Localised = { en: string; bm: string };

/* EN first in the switch, BM as the default selection. */
export const LANGS: Lang[] = ['en', 'bm'];

/** The platform's audience is Malaysian, so Bahasa Melayu is the default. */
export const DEFAULT_LANG: Lang = 'bm';

/** Maps our language keys onto valid BCP 47 tags for <html lang>. */
export const HTML_LANG: Record<Lang, string> = { bm: 'ms-MY', en: 'en-MY' };

export const LANG_COOKIE = 'sh_lang';

/* ------------------------------------------------------------------ routes
   Every public URL carries its locale, which is what lets a search engine
   index the English content at all - until now both languages shared one URL
   and only one of them could ever be crawled.

   The path segment is not the internal key. Ours is `bm`, which is how the
   team refers to the language, but `bm` is a real BCP 47 tag and it means
   Bambara: emitting it in a URL and an hreflang would tell Google the page is
   in a West African language. `ms` is Malay. The map is two lines and it
   keeps 359 dictionary keys from having to be renamed. */

export const LOCALES = ['en', 'ms'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_TO_LANG: Record<Locale, Lang> = { en: 'en', ms: 'bm' };
export const LANG_TO_LOCALE: Record<Lang, Locale> = { en: 'en', bm: 'ms' };

export const DEFAULT_LOCALE: Locale = LANG_TO_LOCALE[DEFAULT_LANG];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** The same path under another locale, for the language switch and hreflang. */
export function swapLocale(pathname: string, to: Locale): string {
  const rest = pathname.replace(/^\/(en|ms)(?=\/|$)/, '');
  return `/${to}${rest || ''}`;
}
