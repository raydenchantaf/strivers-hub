import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { HTML_LANG, LOCALES, LOCALE_TO_LANG, isLocale } from '@/lib/i18n/types';
import '../globals.css';

/**
 * Self-hosted through next/font: no request leaves the visitor's browser for
 * a font file, which is one fewer third party to declare under the PDPA and
 * removes the render-blocking round trip to Google.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.strivershub.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Strivers' Hub",
    template: "%s | Strivers' Hub",
  },
  description:
    'Strivers’ Hub empowers Malaysian women entrepreneurs by closing the digitalisation gap — free assessments, training resources, financing guidance and mentorship.',
  applicationName: "Strivers' Hub",
  authors: [{ name: 'The Asia Foundation' }],
  openGraph: {
    type: 'website',
    siteName: "Strivers' Hub",
    locale: 'ms_MY',
    alternateLocale: ['en_MY'],
  },
  twitter: { card: 'summary_large_image' },
  /* A preview says so in the page too, not only in the header and robots.txt.
     Google resolves a conflict between the two in favour of the restrictive
     one, so a page meta reading "index, follow" under a noindex header would
     still have stayed out of the index - but it reads as a mistake, and the
     next person to check would have to know that rule to trust it. */
  robots:
    process.env.SITE_NOINDEX === '1'
      ? { index: false, follow: false }
      : { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#FFF6F1',
  width: 'device-width',
  initialScale: 1,
};

/**
 * The root layout sits under the locale segment rather than above it, which
 * is what lets <html lang> be right for the page being served. A single root
 * above the segment cannot see which language it is rendering, and the
 * alternative - reading a header - would opt every page out of static
 * generation, which is the thing locale routing was meant to protect.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ga = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang={HTML_LANG[LOCALE_TO_LANG[locale]]}
      className={`${sans.variable} ${serif.variable}`}
    >
      <body>
        {children}
        {ga ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
