import type { Metadata } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

/**
 * The 404 for a URL that matches no route at all.
 *
 * This is not the same file as `[locale]/not-found.tsx`, and it took a broken
 * page to notice. That one catches `notFound()` thrown *inside* the locale
 * segment - an unknown article slug, a locale that is not ours. A URL that
 * matches nothing never enters that segment: Next renders the root
 * `/_not-found` instead, and with no `app/layout.tsx` in this project - the
 * root layout lives under `[locale]` so each language can set its own
 * `<html lang>` - there was nothing there to render. Every mistyped address
 * on the site was served Next's own unstyled black default.
 *
 * Because there is no root layout above it, this file has to supply the
 * document itself: `<html>`, `<body>`, the stylesheet and the fonts.
 *
 * Bilingual rather than localised: the URL matched nothing, so there is no
 * locale segment to read a language from, and guessing wrong on the one page
 * whose whole job is to help someone who is already lost would be a poor
 * trade for a tidier line of text.
 */

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
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

export const metadata: Metadata = {
  title: "Halaman tidak dijumpai / Page not found | Strivers' Hub",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <html lang="ms" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <main className="shell nf">
          <div>
            <span className="eyebrow" style={{ color: 'var(--magenta)' }}>
              404
            </span>
            <h1>
              Halaman tidak dijumpai <span className="serif-i">/ Page not found</span>
            </h1>
            <p>
              Halaman yang anda cari tidak wujud atau telah dialihkan. &mdash; The page you are
              looking for does not exist or has moved.
            </p>
            <p style={{ marginTop: 22 }}>
              <a className="btn btn-solid" href="/">
                <span>Kembali ke laman utama / Back to home</span>{' '}
                <span className="arw">&#8594;</span>
              </a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
