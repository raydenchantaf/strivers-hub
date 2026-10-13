import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { PageHeader } from '@/components/PageHeader';
import { EventsList } from './EventsList';
import { EventsCta } from './Cta';
import { getEvents, split } from '@/lib/events';
import { getArticlesByKind, toView } from '@/lib/content';
import type { EventCard } from '@/components/content/EventRow';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Events',
  description:
    'Workshops, forums and community gatherings across Malaysia — free and open to women entrepreneurs.',
    alternates: alternates('/events', localeOf(`/${locale}`)),
  };
}

export default async function EventsPage() {
  const events = await getEvents();
  const { upcoming, past } = split(events);

  const toCard = (e: (typeof events)[number], isPast: boolean): EventCard => ({
    slug: e.slug,
    title: e.title,
    excerpt: e.excerpt,
    startAt: e.startAt,
    endAt: e.endAt,
    mode: e.mode,
    venue: e.venue,
    city: e.city,
    capacity: e.capacity,
    img: e.img ? { card: e.img.card, alt: e.img.alt, blur: e.img.blur } : null,
    past: isPast,
  });

  /* Until an event document exists, the articles filed under Events still
     appear - the same list the live platform shows. They carry no start date,
     so they can only file as past, which is the honest reading of an article
     about something that already happened. */
  const legacy =
    events.length === 0
      ? (await getArticlesByKind('event')).map(toView).map(
          (a): EventCard => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            startAt: a.publishedAt || null,
            endAt: null,
            mode: 'in-person',
            venue: null,
            city: null,
            capacity: null,
            img: a.img.card ? { card: a.img.card, alt: a.img.alt, blur: a.img.blur } : null,
            past: true,
          }),
        )
      : [];

  return (
    <>
      <PageHeader eyebrow="ep.eyebrow" title="ep.h1" lede="ep.lede" />
      <EventsList
        upcoming={upcoming.map((e) => toCard(e, false))}
        past={[...past.map((e) => toCard(e, true)), ...legacy]}
      />
      <EventsCta />
    </>
  );
}
