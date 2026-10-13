'use client';

import { PortableText } from '@portabletext/react';
import { useState } from 'react';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import type { LegalSection } from './fallback';

export function LegalView({
  sections,
  updatedAt,
  fromCms,
}: {
  sections: LegalSection[];
  updatedAt: string;
  fromCms: boolean;
}) {
  const { t, lang, p } = useLang();
  const [active, setActive] = useState(0);

  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(32px,3.6vw,48px)' }}>
        <HeaderField />
        <div className="shell">
          <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
            {t('pp.eyebrow')}
          </span>
          <h1 className="ld ld-2" dangerouslySetInnerHTML={{ __html: t('pp.h1') }} />
          <p className="lede ld ld-3">{t('pp.lede')}</p>
          <p className="lupd ld ld-4" style={{ marginTop: 22 }}>
            {t('pp.updated')}
          </p>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 'clamp(34px,4vw,54px)' }}>
        <div className="shell">
          <div className="legal">
            <nav className="ltoc" aria-label={t('pp.toc')}>
              <b>{t('pp.toc')}</b>
              {sections.map((s, i) => (
                <a
                  key={i}
                  href={`#pp${i}`}
                  className={active === i ? 'on' : undefined}
                  onClick={() => setActive(i)}
                >
                  {p(s.heading)}
                </a>
              ))}
            </nav>

            <div className="lbody">
              {sections.map((s, i) => (
                <section key={i}>
                  <h2 id={`pp${i}`}>{p(s.heading)}</h2>
                  <PortableText value={s.body[lang] ?? s.body.en} />
                </section>
              ))}
              {fromCms ? null : (
                <p className="lupd" style={{ marginTop: 36 }}>
                  {t('pp.abridged')}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
