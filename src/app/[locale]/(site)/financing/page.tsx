import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { PageHeader } from '@/components/PageHeader';
import { FinanceRoutes, FinanceGuides } from './Sections';
import { getArticlesByKind, toView } from '@/lib/content';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Financing & funding',
  description:
    'Four financing routes open to women-owned businesses in Malaysia, and what each one usually asks for.',
    alternates: alternates('/financing', localeOf(`/${locale}`)),
  };
}

export default async function FinancingPage() {
  const guides = (await getArticlesByKind('financing')).map(toView);
  return (
    <>
      <PageHeader eyebrow="fp.eyebrow" title="fp.h1" lede="fp.lede" />
      <FinanceRoutes />
      <FinanceGuides items={guides} />
    </>
  );
}
