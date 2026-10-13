import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { HomeView } from './HomeView';
import { getAllArticles, hrefFor, toView } from '@/lib/content';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: "Strivers' Hub — Bridging Digital Opportunities",
  description:
    'Five minutes. Twenty-four questions. One digital plan matched to where your business actually is. Free training, financing guidance and mentorship for Malaysian women entrepreneurs.',
    alternates: alternates('/', localeOf(`/${locale}`)),
  };
}

export default async function HomePage() {
  const all = await getAllArticles();
  const resources = all.filter((a) => a.kind === 'resource');
  return (
    <HomeView
      latest={resources.slice(0, 4).map(toView)}
      total={resources.length}
      /* what the hive game can recommend at its end: guides and financing,
         not events, which date */
      hive={all
        .filter((a) => a.kind !== 'event')
        .map((a) => ({ href: hrefFor(a), title: a.title, cats: a.categories.map((c) => c.en) }))}
      /* every published piece, not just the ones filed under Resources -
         the stat counts guides and resources across the whole platform */
      guides={all.length}
    />
  );
}
