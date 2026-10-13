import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticlePage } from '@/components/content/ArticlePage';
import {
  getAllSlugs,
  getArticle,
  getRelated,
  readingMinutes,
  toView,
  type Kind,
} from './content';

/**
 * Resources, Events and Financing all read the same way, so they share one
 * route implementation. Each section keeps its own URL prefix so the back
 * link and the breadcrumb stay honest about where the reader came from.
 */

export async function articleParams(kind: Kind) {
  const slugs = await getAllSlugs();
  return slugs.filter((s) => s.kind === kind).map((s) => ({ slug: s.slug }));
}

export async function articleMetadata(
  kind: Kind,
  slug: string,
  route: string,
): Promise<Metadata> {
  const article = await getArticle(slug);
  if (!article || article.kind !== kind) return { title: 'Not found' };
  const view = toView(article);
  return {
    title: article.title.en || article.title.bm,
    description: article.excerpt.en || article.excerpt.bm,
    alternates: { canonical: `${route}/${slug}` },
    openGraph: {
      type: 'article',
      title: article.title.en || article.title.bm,
      description: article.excerpt.en || article.excerpt.bm,
      publishedTime: article.publishedAt || undefined,
      images: view.img.lead ? [{ url: view.img.lead, width: 1440, height: 810 }] : undefined,
    },
  };
}

export async function renderArticle(kind: Kind, slug: string) {
  const article = await getArticle(slug);
  if (!article || article.kind !== kind) notFound();

  const related = (await getRelated(article)).map(toView);
  const view = toView(article);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title.en || article.title.bm,
    description: article.excerpt.en || article.excerpt.bm,
    datePublished: article.publishedAt || undefined,
    image: view.img.lead || undefined,
    author: { '@type': 'Organization', name: "Strivers' Hub" },
    publisher: { '@type': 'Organization', name: "Strivers' Hub" },
    inLanguage: ['ms-MY', 'en-MY'],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticlePage
        article={{ ...view, body: article.body }}
        related={related}
        minutes={{
          en: readingMinutes(article.body.en),
          bm: readingMinutes(article.body.bm),
        }}
      />
    </>
  );
}
