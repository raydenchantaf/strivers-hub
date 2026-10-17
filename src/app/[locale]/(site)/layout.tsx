import { notFound } from 'next/navigation';
import { LangProvider } from '@/components/LangProvider';
import { Announcement, Footer, PartnerBand } from '@/components/Footer';
import { getSettings } from '@/lib/settings';
import { Helper } from '@/components/Helper';
import { Analytics } from '@/components/Analytics';
import { CookieNotice } from '@/components/Consent';
import { IconSprite } from '@/components/Icons';
import { Nav } from '@/components/Nav';
import { isLocale } from '@/lib/i18n/types';

/**
 * Language comes from the URL now, not from a cookie read on the server.
 *
 * Both readings keep every page static - which was the reason for the cookie
 * in the first place - but only this one gives each language its own address.
 * Without that a crawler sees one URL serving two languages and indexes at
 * most one of them, which is why none of the English content is findable on
 * the live platform today.
 *
 * The locale segment's own layout declares the static params; this one only
 * puts the chrome on.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = await getSettings();

  return (
    <LangProvider locale={locale}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {settings.announcement ? <Announcement a={settings.announcement} /> : null}
      <Nav />
      <IconSprite />
      <main id="main">{children}</main>
      <PartnerBand partners={settings.partners} />
      <Footer blurb={settings.blurb} social={settings.social} />
      <Helper />
      <CookieNotice />
      <Analytics />
    </LangProvider>
  );
}
