'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/types';

/**
 * A link that stays in the locale you are reading.
 *
 * Every internal href in the codebase is written unprefixed - `/resources`,
 * not `/ms/resources` - and this puts the locale on. Doing it here rather
 * than at each of the several dozen call sites means a link cannot be added
 * later that quietly drops the reader back into Malay.
 *
 * The locale is read from the path rather than from context so that this
 * works in any client component, including ones rendered outside the site
 * layout. Anything that is not a site-relative path - an anchor, a mailto, an
 * external URL - is passed through untouched.
 */
export const L = forwardRef<HTMLAnchorElement, React.ComponentProps<typeof NextLink>>(
  function L({ href, ...rest }, ref) {
    const pathname = usePathname();
    const first = pathname.split('/')[1] ?? '';
    const locale = isLocale(first) ? first : DEFAULT_LOCALE;

    const to =
      typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')
        ? `/${locale}${href === '/' ? '' : href}`
        : href;

    return <NextLink ref={ref} href={to} {...rest} />;
  },
);
