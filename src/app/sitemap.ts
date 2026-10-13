import type { MetadataRoute } from 'next';
import { getAllSlugs, routeForKind } from '@/lib/content';
import { getEvents } from '@/lib/events';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/types';
import { localised } from '@/lib/i18n/routing';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.strivershub.com';

const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, freq: 'weekly' },
  { path: '/assessment', priority: 0.9, freq: 'monthly' },
  { path: '/resources', priority: 0.8, freq: 'weekly' },
  { path: '/financing', priority: 0.7, freq: 'monthly' },
  { path: '/events', priority: 0.7, freq: 'weekly' },
  { path: '/mentorship', priority: 0.7, freq: 'monthly' },
  { path: '/about', priority: 0.5, freq: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, freq: 'yearly' },
];

/** Both locales for every page, each entry naming the other as its alternate.
 *  A sitemap that lists one language tells the crawler the other does not
 *  exist, which is the position the live platform is in. */
function entry(
  path: string,
  lastModified: Date,
  freq: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l === 'ms' ? 'ms-MY' : 'en-MY'] = `${base}${localised(path, l)}`;
  }
  languages['x-default'] = `${base}${localised(path, DEFAULT_LOCALE)}`;

  return LOCALES.map((l) => ({
    url: `${base}${localised(path, l)}`,
    lastModified,
    changeFrequency: freq,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, events] = await Promise.all([
    getAllSlugs().catch(() => []),
    getEvents().catch(() => []),
  ]);

  return [
    ...STATIC.flatMap((s) => entry(s.path, new Date(), s.freq, s.priority)),
    ...articles.flatMap((a) =>
      entry(`${routeForKind[a.kind]}/${a.slug}`, new Date(a.updatedAt), 'monthly', 0.6),
    ),
    ...events.flatMap((e) => entry(`/events/${e.slug}`, new Date(), 'weekly', 0.6)),
  ];
}
