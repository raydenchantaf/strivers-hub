import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { CtaBand } from '@/components/CtaBand';
import { ResourceIndex } from '@/components/content/ResourceIndex';
import { getArticlesByKind, toView } from '@/lib/content';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Resources',
  description:
    'Free guides, videos and tutorials written for small businesses in Malaysia. No fees, no sign-up.',
    alternates: alternates('/resources', localeOf(`/${locale}`)),
  };
}

export default async function ResourcesPage() {
  const items = (await getArticlesByKind('resource')).map(toView);
  return (
    <>
      <ResourceIndex items={items} />
      <CtaBand />
    </>
  );
}
