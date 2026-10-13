import 'server-only';
import type { PortableTextBlock } from '@portabletext/react';
import { sanityFetch } from '@/sanity/client';
import {
  ALL_RESOURCES,
  ALL_SLUGS,
  RELATED_RESOURCES,
  RESOURCE_BY_SLUG,
} from '@/sanity/queries';
import { dimensionsOf, urlFor, type SanityImage } from '@/sanity/image';
import {
  hrefFor,
  kindOf,
  type Article,
  type ArticleCard,
  type CardView,
  type CategoryRef,
  type Kind,
} from './content-format';

export * from './content-format';

type RawCard = {
  id: string;
  slug: string;
  publishedAt: string | null;
  title_en?: string;
  title_bm?: string;
  excerpt_en?: string;
  excerpt_bm?: string;
  image?: SanityImage | null;
  categories?: (CategoryRef | null)[] | null;
  featured?: boolean;
};

function toCard(raw: RawCard): ArticleCard {
  const categories = (raw.categories ?? []).filter(Boolean) as CategoryRef[];
  return {
    id: raw.id,
    slug: raw.slug,
    publishedAt: raw.publishedAt ?? '',
    title: { en: raw.title_en ?? '', bm: raw.title_bm ?? raw.title_en ?? '' },
    excerpt: { en: raw.excerpt_en ?? '', bm: raw.excerpt_bm ?? raw.excerpt_en ?? '' },
    image: raw.image ?? null,
    categories,
    featured: raw.featured ?? false,
    kind: kindOf(categories),
  };
}

export async function getAllArticles(): Promise<ArticleCard[]> {
  const rows = await sanityFetch<RawCard[]>(ALL_RESOURCES, { tags: ['resource'] });
  return rows.map(toCard);
}

export async function getArticlesByKind(kind: Kind): Promise<ArticleCard[]> {
  const all = await getAllArticles();
  const list = all.filter((a) => a.kind === kind);
  // an explicitly featured piece leads the page; otherwise the newest does
  const featured = list.findIndex((a) => a.featured);
  if (featured > 0) list.unshift(list.splice(featured, 1)[0]);
  return list;
}

export async function getArticle(slug: string): Promise<Article | null> {
  const raw = await sanityFetch<
    (RawCard & { body_en?: PortableTextBlock[]; body_bm?: PortableTextBlock[] }) | null
  >(RESOURCE_BY_SLUG, { params: { slug }, tags: ['resource', `resource:${slug}`] });
  if (!raw) return null;
  return {
    ...toCard(raw),
    body: { en: raw.body_en ?? [], bm: raw.body_bm ?? raw.body_en ?? [] },
  };
}

export async function getRelated(article: ArticleCard, limit = 3): Promise<ArticleCard[]> {
  const categoryValues = article.categories.map((c) => c.value).filter(Boolean);
  const rows = await sanityFetch<RawCard[]>(RELATED_RESOURCES, {
    params: { slug: article.slug, categoryValues },
    tags: ['resource'],
  });
  return rows
    .map(toCard)
    .filter((a) => a.kind === article.kind)
    .slice(0, limit);
}

export async function getAllSlugs(): Promise<
  { slug: string; kind: Kind; updatedAt: string }[]
> {
  const rows = await sanityFetch<
    { slug: string; categories: (string | null)[] | null; _updatedAt: string }[]
  >(ALL_SLUGS, { tags: ['resource'] });
  // the slug query returns raw category values, so map them back to names
  return rows.map((r) => ({
    slug: r.slug,
    kind: kindOf(((r.categories ?? []).filter(Boolean) as string[]).map((v) => ({
      en: v,
      bm: v,
      value: v,
    }))),
    updatedAt: r._updatedAt,
  }));
}

/* Image URLs are resolved on the server so the image-url builder never ships
   to the browser, and so each component gets exactly the crop it renders. */

const BLANK = { thumb: '', card: '', lead: '', alt: '', w: 0, h: 0 };

export function toView(a: ArticleCard): CardView {
  /* Cards ask the CDN for a crop, because a grid needs one shape. The lead
     asks for a width only: event posters and infographics carry text to the
     edges, and a 16:9 crop was cutting the dates and the sign-up panel off
     the bottom. */
  const natural = a.image ? dimensionsOf(a.image) : null;
  const img = a.image
    ? {
        thumb: urlFor(a.image, 320, 200),
        card: urlFor(a.image, 720, 405),
        lead: urlFor(a.image, 1440),
        alt: (a.image as { alt?: string }).alt ?? '',
        w: natural?.width ?? 1440,
        h: natural?.height ?? 810,
      }
    : BLANK;
  return {
    id: a.id,
    slug: a.slug,
    href: hrefFor(a),
    kind: a.kind,
    publishedAt: a.publishedAt,
    title: a.title,
    excerpt: a.excerpt,
    categories: a.categories,
    img,
  };
}
