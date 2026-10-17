'use client';

import Image from 'next/image';
import { L as Link } from '@/components/L';
import type { Partner, Settings } from '@/lib/settings';
import { CookieSettingsLink } from './Consent';
import { useLang } from './LangProvider';

/* `w`/`h` are each file's own pixels; `width` is how wide it is drawn.
   The height used to be computed as width * 0.28 for all three, which held
   while every logo was a two-line lockup of roughly the same proportion. The
   Asia Foundation's new logo is a single line with no tagline - 8.89:1 rather
   than 3.6:1 - so that one ratio now reserves the wrong box for it, and the
   page shifts when it loads. Each logo carries its own. */
const PARTNERS = [
  { name: 'The Asia Foundation', src: '/img/partner-taf.webp', w: 900, h: 101, width: 290, href: 'https://asiafoundation.org' },
  { name: 'Mastercard Center for Inclusive Growth', src: '/img/partner-cfig-white.webp', w: 280, h: 74, width: 168, href: 'https://www.mastercardcenter.org' },
  { name: 'MyDIGITAL Corporation', src: '/img/partner-mydigital.webp', w: 240, h: 68, width: 140, href: 'https://mydigital.gov.my' },
];

/* Partners set in the Studio (Site settings) replace the built-in list. One
   without an uploaded logo keeps the built-in logo of the same name, or shows
   its name as text. */
function partnersFrom(cms: Partner[] | null) {
  if (!cms) return PARTNERS;
  return cms.map((p) => {
    const known = PARTNERS.find((k) => k.name.toLowerCase() === p.name.toLowerCase());
    const href = p.url || known?.href || '';
    if (p.logo) {
      const width = Math.round(Math.min(290, Math.max(120, (p.logo.width / p.logo.height) * 34)));
      return { name: p.name, src: p.logo.src, w: p.logo.width, h: p.logo.height, width, href };
    }
    return known ? { ...known, href } : { name: p.name, src: '', w: 1, h: 1, width: 0, href };
  });
}

export function PartnerBand({ partners: cms = null }: { partners?: Partner[] | null }) {
  const { t } = useLang();
  const partners = partnersFrom(cms);
  return (
    <section
      className="band band-dark"
      style={{
        paddingTop: 'clamp(46px,5vw,66px)',
        paddingBottom: 'clamp(30px,3.5vw,44px)',
      }}
    >
      <div className="shell" style={{ textAlign: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--saffron)' }}>
          {t('part.eyebrow')}
        </span>
        <div className="partners" style={{ marginTop: 28 }}>
          {partners.map((p) => (
            <a
              key={p.name}
              href={p.href || undefined}
              target="_blank"
              rel="noopener noreferrer"
              data-track="partner"
              data-label={p.name}
            >
              {/* the link already reads as the partner's name, from the logo's
                  alt; the bubble is for sighted pointer and keyboard users */}
              <span className="pt-tip" aria-hidden="true">
                {t('part.explore')} <b>{p.name}</b> <span className="pt-arrow">&#8599;</span>
              </span>
              {p.src ? (
                <Image
                  src={p.src}
                  alt={p.name}
                  width={p.width}
                  height={Math.round((p.width * p.h) / p.w)}
                  style={{ width: p.width, height: 'auto' }}
                />
              ) : (
                <span className="partner-name">{p.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const SOCIAL = [
  { platform: 'Facebook', url: 'https://www.facebook.com/strivershub/' },
  { platform: 'Instagram', url: 'https://www.instagram.com/strivers.hub/' },
  { platform: 'YouTube', url: 'https://www.youtube.com/@StriversHUB' },
  { platform: 'LinkedIn', url: 'https://www.linkedin.com/company/the-asia-foundation' },
];

/** A one-line notice above the header, set in the Studio (Site settings). */
export function Announcement({ a }: { a: NonNullable<Settings['announcement']> }) {
  const { lang } = useLang();
  const text = lang === 'en' ? a.en : a.bm;
  return (
    <div className="annc" role="note">
      {a.href ? (
        <a href={a.href}>
          {text} <span aria-hidden="true">&#8594;</span>
        </a>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}

export function Footer({
  blurb = null,
  social = null,
}: {
  blurb?: Settings['blurb'];
  social?: Settings['social'];
}) {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="shell">
        <div className="foot-top">
          <div>
            <Image
              className="fl"
              src="/img/logo-white.webp"
              alt="Strivers' Hub"
              width={326}
              height={102}
              style={{ width: 170, height: 'auto' }}
            />
            <p>{blurb ? (lang === 'en' ? blurb.en : blurb.bm) : t('foot.blurb')}</p>
          </div>
          <div>
            <h2>{t('foot.c1')}</h2>
            <ul>
              <li><Link href="/assessment">{t('foot.l1')}</Link></li>
              <li><Link href="/resources">{t('nav.res')}</Link></li>
              <li><Link href="/financing">{t('nav.fin')}</Link></li>
              <li><Link href="/events">{t('nav.events')}</Link></li>
            </ul>
          </div>
          <div>
            <h2>{t('foot.c2')}</h2>
            <ul>
              <li><Link href="/mentorship">{t('nav.mentor')}</Link></li>
              <li><Link href="/about">{t('nav.about')}</Link></li>
              <li>
                <a href="https://rakyatdigital.gov.my" target="_blank" rel="noopener noreferrer">
                  Rakyat Digital
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2>{t('foot.c3')}</h2>
            <ul>
              {(social ?? SOCIAL).map((s) => (
                <li key={s.platform + s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <span className="foot-legal">
            <span>&copy; 2024&ndash;{year} Strivers&#8217; Hub</span>
            <Link href="/privacy-policy">{t('foot.legal')}</Link>
            <CookieSettingsLink />
          </span>
          {/* the builder's credit: last thing on the page, small, not a link */}
          <span className="foot-by">
            <span>{t('nav.by')}</span>
            <Image src="/img/unbound-light.webp" alt="UnBound" width={480} height={117} />
          </span>
        </div>
      </div>
    </footer>
  );
}
