import type { Metadata } from 'next';
import { articleMetadata, articleParams, renderArticle } from '@/lib/article-route';

export const revalidate = 3600;

export function generateStaticParams() {
  return articleParams('event');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return articleMetadata('event', slug, '/events');
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderArticle('event', slug);
}
