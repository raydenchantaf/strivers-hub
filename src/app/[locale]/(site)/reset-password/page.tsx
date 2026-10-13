import type { Metadata } from 'next';
import { alternates, localeOf } from '@/lib/i18n/routing';
import { Suspense } from 'react';
import { PasswordView } from '@/components/PasswordView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
  title: 'Choose a new password',
  description: "Set a new password for your Strivers' Hub account.",
  robots: { index: false, follow: false },
    alternates: alternates('/reset-password', localeOf(`/${locale}`)),
  };
}

export default function Page() {
  return (
    <Suspense>
      <PasswordView mode="reset" />
    </Suspense>
  );
}
