import type { Metadata } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import '../globals.css';

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

export const metadata: Metadata = {
  title: "Insights | Strivers' Hub",
  robots: { index: false, follow: false },
};

/**
 * The insights dashboard is its own root, like the Studio: it sits outside
 * the locale segment, is in English for the people who run the programme,
 * and carries none of the public site's chrome.
 */
export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="ins-body">{children}</body>
    </html>
  );
}
