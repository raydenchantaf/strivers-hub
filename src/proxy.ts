import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LANG_TO_LOCALE, LOCALES, isLocale } from '@/lib/i18n/types';

/**
 * Every public URL carries its locale. This sends the ones that do not to the
 * one they belong to.
 *
 * It matters more than a tidy-up. The live platform serves both languages
 * from a single URL, so a crawler can only ever index one of them, and the
 * English content is invisible. It also matters that this is a redirect and
 * not a rewrite: the prefixed URL has to be the address, or the two languages
 * are back to sharing one.
 *
 * Which locale an unprefixed URL goes to is the visitor's stored choice where
 * there is one, and Malay otherwise. Accept-Language is deliberately not
 * consulted - the audience is Malaysian and a browser set to English by
 * default would send Malay speakers to the wrong half of the site.
 *
 * The file is `proxy.ts`, not `middleware.ts`: Next 16 renamed the convention
 * and builds warn on the old name. Same runtime, same matcher, same edge.
 */

const PASS = /^\/(_next|api|studio|img|favicon|icon-|apple-touch-icon|manifest|robots|sitemap|\.well-known)/;

/**
 * A dot in the last segment means a file, not a page.
 *
 * Middleware runs before Next serves anything out of `public/`, so without
 * this every file dropped in there - a PDF, a domain-verification page, the
 * wireframes - gets sent to `/ms/<file>` and 404s. Naming them one by one in
 * PASS only works for the ones that existed when the list was written; no
 * route on this site has a dot in its final segment, so the general rule is
 * both safer and shorter.
 */
const FILE = /\/[^/]+\.[^/]+$/;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PASS.test(pathname) || FILE.test(pathname)) return NextResponse.next();

  const first = pathname.split('/')[1] ?? '';
  if (isLocale(first)) return NextResponse.next();

  const saved = request.cookies.get('sh_lang')?.value;
  const locale =
    saved === 'en' || saved === 'bm' ? LANG_TO_LOCALE[saved] : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    /* everything except the files and routes that have no locale: static
       assets, the API, the Studio, and the crawler files at the root */
    '/((?!_next/|api/|studio|img/|favicon|icon-|apple-touch-icon|manifest|robots.txt|sitemap.xml).*)',
  ],
};

export { LOCALES };
