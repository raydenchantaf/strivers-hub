import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { AboutView } from './AboutView';
import { getAboutContent } from '@/lib/pages';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'About us',
  description:
    "Strivers' Hub is a collaboration between the Mastercard Center for Inclusive Growth and The Asia Foundation to digitalise and support the growth of 100,000 MSMEs in Malaysia.",
    alternates: alternates('/about', localeOf(`/${locale}`)),
  };
}

export default async function Page() {
  return <AboutView c={await getAboutContent()} />;
}
