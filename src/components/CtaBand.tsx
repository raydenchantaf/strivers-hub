'use client';

import { L as Link } from '@/components/L';
import { useLang } from './LangProvider';
import { Reveal } from './Reveal';

/**
 * Full-bleed gradient band, built the same way as the homepage's Rakyat
 * Digital band so the two read as one component rather than two ideas.
 * Copy on the left, the action on the right.
 */
export function CtaBand() {
  const { t } = useLang();
  return (
    <section className="cta-band">
      <div className="shell">
        <Reveal className="cta-in">
          <div className="cta-say">
            <span className="eyebrow">{t('rp.ctaEyebrow')}</span>
            <h2>{t('rp.ctaH')}</h2>
            <p>{t('rp.ctaP')}</p>
          </div>
          <Link className="btn btn-light" href="/assessment">
            <span>{t('rp.ctaB')}</span> <span className="arw">&#8594;</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

