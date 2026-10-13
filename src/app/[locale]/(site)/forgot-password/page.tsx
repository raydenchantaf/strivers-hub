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
  title: 'Reset your password',
  description: "Request a link to set a new password for your Strivers' Hub account.",
  robots: { index: false, follow: true },
    alternates: alternates('/forgot-password', localeOf(`/${locale}`)),
  };
}

export default function Page() {
  return (
    <Suspense>
      <PasswordView mode="forgot" />
    </Suspense>
  );
}
