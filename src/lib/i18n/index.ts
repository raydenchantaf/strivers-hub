import { dict } from './dict';
import { DEFAULT_LANG, LANG_COOKIE, type Lang, type Localised } from './types';

export * from './types';
export { dict };

/** Look a string up. Unknown keys return the key, which makes gaps obvious. */
export function t(key: string, lang: Lang): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] ?? entry[DEFAULT_LANG];
}

/** Pick one language out of a value the CMS stores in both. */
export function pick(value: Localised | null | undefined, lang: Lang): string {
  if (!value) return '';
  return value[lang] || value.en || value.bm || '';
}

/** Substitute {name} placeholders, used by the few strings that take a count. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'bm';
}

/**
 * Read the visitor's language from the request cookie.
 * Server components only - the client reads it from LangProvider.
 */
export async function langFromCookies(): Promise<Lang> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}
