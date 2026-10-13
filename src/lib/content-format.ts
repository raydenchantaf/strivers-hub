/* Presentation helpers and the shapes the UI works with.
   Deliberately free of any server import: client components render dates and
   read CardView, and pulling the Sanity client in behind them would drag a
   server-only module into the browser bundle. */

import type { PortableTextBlock } from '@portabletext/react';
import type { SanityImage } from '@/sanity/image';
import { EVENT_CATEGORIES, FINANCE_CATEGORIES } from '@/sanity/queries';
import type { Lang, Localised } from './i18n/types';

export type Kind = 'resource' | 'event' | 'financing';

export interface CategoryRef extends Localised {
  value?: string;
}

export interface ArticleCard {
  id: string;
  slug: string;
  publishedAt: string;
  title: Localised;
  excerpt: Localised;
  image: SanityImage | null;
  categories: CategoryRef[];
  featured?: boolean;
  kind: Kind;
}

export interface Article extends ArticleCard {
  body: { en: PortableTextBlock[]; bm: PortableTextBlock[] };
}

/**
 * Which part of the site a piece belongs to. Editors tag content with the
 * categories they already use; we route on those rather than asking them to
 * maintain a second "section" field that could drift out of step.
 */
export function kindOf(categories: CategoryRef[]): Kind {
  const names = new Set(categories.map((c) => c.en));
  if (FINANCE_CATEGORIES.some((c) => names.has(c))) return 'financing';
  if (EVENT_CATEGORIES.some((c) => names.has(c))) return 'event';
  return 'resource';
}

/* ---------------- presentation helpers ---------------- */

const MONTHS: Record<Lang, string[]> = {
  bm: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()].toUpperCase()} ${d.getUTCFullYear()}`;
}

export function dateParts(iso: string, lang: Lang) {
  if (!iso) return { day: '', month: '', year: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: '', month: '', year: '' };
  return {
    day: String(d.getUTCDate()),
    month: MONTHS[lang][d.getUTCMonth()].toUpperCase(),
    year: String(d.getUTCFullYear()),
  };
}

const WORDS_PER_MINUTE = 200;

/** Reading time from the Portable Text itself, so it tracks the real body. */
export function readingMinutes(blocks: PortableTextBlock[]): number {
  let words = 0;
  for (const block of blocks ?? []) {
    if (block._type !== 'block') continue;
    for (const child of (block.children ?? []) as { text?: string }[]) {
      words += (child.text ?? '').split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export const routeForKind: Record<Kind, string> = {
  resource: '/resources',
  event: '/events',
  financing: '/financing',
};

export function hrefFor(article: ArticleCard): string {
  return `${routeForKind[article.kind]}/${article.slug}`;
}

export interface CardView {
  id: string;
  slug: string;
  href: string;
  kind: Kind;
  publishedAt: string;
  title: Localised;
  excerpt: Localised;
  categories: CategoryRef[];
  img: {
    thumb: string;
    card: string;
    /** Uncropped, so an article can render the image at its own proportions. */
    lead: string;
    alt: string;
    /** A blurred thumbnail for the space around a picture shown whole. */
    blur: string;
    /** Natural size of the source, used to reserve space and avoid reflow. */
    w: number;
    h: number;
  };
}
