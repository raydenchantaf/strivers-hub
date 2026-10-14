'use client';

import Image from 'next/image';
import { L as Link } from '@/components/L';
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

export function PartnerBand() {
  const { t } = useLang();
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
          {PARTNERS.map((p) => (
            <a
              key={p.name}
              href={p.href}
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
              <Image
                src={p.src}
                alt={p.name}
                width={p.width}
                height={Math.round((p.width * p.h) / p.w)}
                style={{ width: p.width, height: 'auto' }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useLang();
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
            <p>{t('foot.blurb')}</p>
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
              <li><a href="https://www.facebook.com/strivershub/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://www.instagram.com/strivers.hub/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://www.youtube.com/@StriversHUB" target="_blank" rel="noopener noreferrer">YouTube</a></li>
              <li><a href="https://www.linkedin.com/company/the-asia-foundation" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <span className="foot-legal">
            <span>&copy; 2024&ndash;{year} Strivers&#8217; Hub</span>
            <Link href="/privacy-policy">{t('foot.legal')}</Link>
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
