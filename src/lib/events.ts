import 'server-only';
import { groq } from 'next-sanity';
import { sanityFetch } from '@/sanity/client';
import { dimensionsOf, urlFor, type SanityImage } from '@/sanity/image';
import type { PortableTextBlock } from '@portabletext/types';

/**
 * Events, from the `event` type.
 *
 * The index still falls back to the article-based events the live dataset
 * carries, so the page is never empty on a dataset where no event document
 * has been created yet. The fallback is the old behaviour, not a second
 * feature: articles have no start date, so they all file as past.
 */

export type EventMode = 'in-person' | 'online' | 'hybrid';

export type EventDoc = {
  id: string;
  slug: string;
  title: { en: string; bm: string };
  excerpt: { en: string; bm: string };
  body: { en: PortableTextBlock[]; bm: PortableTextBlock[] };
  startAt: string | null;
  endAt: string | null;
  mode: EventMode;
  venue: string | null;
  city: string | null;
  capacity: number | null;
  registrationUrl: string | null;
  categories: { en: string; bm: string }[];
  img: { card: string; lead: string; alt: string; w: number; h: number } | null;
  featured: boolean;
};

const FIELDS = groq`
  "id": _id, "slug": slug.current,
  title_en, title_bm, excerpt_en, excerpt_bm,
  startAt, endAt, mode, venue, city, capacity, registrationUrl, featured,
  image,
  "categories": category[]->{ "en": title_en, "bm": title_bm }
`;

const LIST = groq`*[_type == "event" && defined(slug.current)] | order(startAt desc){ ${FIELDS} }`;
const ONE = groq`*[_type == "event" && slug.current == $slug][0]{
  ${FIELDS},
  body_en[]{ ..., _type == "image" => { ..., "dimensions": asset->metadata.dimensions } },
  body_bm[]{ ..., _type == "image" => { ..., "dimensions": asset->metadata.dimensions } }
}`;

type Row = Record<string, unknown>;

function shape(r: Row): EventDoc {
  const image = r.image as (SanityImage & { alt?: string }) | undefined;
  const dims = image ? dimensionsOf(image) : null;
  const en = (k: string) => (r[`${k}_en`] as string | undefined) ?? '';
  const bm = (k: string) => (r[`${k}_bm`] as string | undefined) || en(k);

  return {
    id: String(r.id ?? ''),
    slug: String(r.slug ?? ''),
    title: { en: en('title'), bm: bm('title') },
    excerpt: { en: en('excerpt'), bm: bm('excerpt') },
    body: {
      en: (r.body_en as PortableTextBlock[]) ?? [],
      bm: ((r.body_bm as PortableTextBlock[])?.length
        ? (r.body_bm as PortableTextBlock[])
        : (r.body_en as PortableTextBlock[])) ?? [],
    },
    startAt: (r.startAt as string | undefined) ?? null,
    endAt: (r.endAt as string | undefined) ?? null,
    mode: ((r.mode as EventMode | undefined) ?? 'in-person') as EventMode,
    venue: (r.venue as string | undefined) ?? null,
    city: (r.city as string | undefined) ?? null,
    capacity: typeof r.capacity === 'number' ? r.capacity : null,
    registrationUrl: (r.registrationUrl as string | undefined) ?? null,
    categories: ((r.categories as { en: string; bm: string }[] | undefined) ?? []).filter(Boolean),
    img: image
      ? {
          card: urlFor(image, 720, 405),
          lead: urlFor(image, 1440),
          alt: image.alt ?? '',
          w: dims?.width ?? 1440,
          h: dims?.height ?? 810,
        }
      : null,
    featured: Boolean(r.featured),
  };
}

export async function getEvents(): Promise<EventDoc[]> {
  const rows = await sanityFetch<Row[] | null>(LIST, { revalidate: 3600 }).catch(() => null);
  return (rows ?? []).map(shape);
}

export async function getEvent(slug: string): Promise<EventDoc | null> {
  const row = await sanityFetch<Row | null>(ONE, { params: { slug }, revalidate: 3600 }).catch(
    () => null,
  );
  return row ? shape(row) : null;
}

/** Upcoming soonest-first, then past newest-first - the order a visitor wants
 *  them in, which is not the order either group sorts in on its own. */
export function split(events: EventDoc[], now = Date.now()) {
  const dated = events.filter((e) => e.startAt);
  const upcoming = dated
    .filter((e) => Date.parse(e.endAt ?? e.startAt ?? '') >= now)
    .sort((a, b) => Date.parse(a.startAt ?? '') - Date.parse(b.startAt ?? ''));
  const past = dated
    .filter((e) => Date.parse(e.endAt ?? e.startAt ?? '') < now)
    .sort((a, b) => Date.parse(b.startAt ?? '') - Date.parse(a.startAt ?? ''));
  return { upcoming, past };
}
