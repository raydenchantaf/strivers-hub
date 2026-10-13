import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { redirect } from 'next/navigation';
import { AuthView } from '@/components/AuthView';
import { readSession } from '@/lib/auth/session';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Join us',
  robots: { index: false, follow: false },
    alternates: alternates('/register', localeOf(`/${locale}`)),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (await readSession()) redirect(`/${locale}/dashboard`);
  return <AuthView mode="up" />;
}
