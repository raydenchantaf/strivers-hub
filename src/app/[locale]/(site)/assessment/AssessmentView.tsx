'use client';

import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { AssessmentTool } from '@/components/assessment/AssessmentTool';
import type { Band } from '@/lib/assessment/types';

const FACTS = [
  { key: 'f1', color: 'var(--plum)', glyph: '24' },
  { key: 'f2', color: 'var(--jade)', glyph: '5' },
  { key: 'f3', color: 'var(--orange-ink)', glyph: '3' },
] as const;

/* What the visitor walks away with. Three outcomes, carried on the same
   stage-weighted cards the homepage uses for the learning pathways. */
const OUTCOMES = [
  { n: 1, cls: '', colour: 'var(--magenta)' },
  { n: 2, cls: ' s2', colour: 'var(--jade)' },
  { n: 3, cls: '', colour: 'var(--saffron)', ink: 'var(--saffron-ink)' },
];

export function AssessmentView({ bands }: { bands: Band[] }) {
  const { t } = useLang();
  return (
    <>
    <header className="as-hero phead" style={{ paddingBottom: 'clamp(56px,6.5vw,92px)' }}>
      <HeaderField />
      <div className="shell">
        <div className="as-grid">
          <div>
            <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
              {t('as.eyebrow')}
            </span>
            <h1
              className="hero-h ld ld-2"
              style={{ fontSize: 'clamp(1.9rem,3.2vw,2.55rem)' }}
              dangerouslySetInnerHTML={{ __html: t('as.h1') }}
            />
            <p
              className="hero-lede ld ld-3"
              style={{ fontSize: 'clamp(.96rem,1.3vw,1.05rem)', maxWidth: '42ch' }}
            >
              {t('as.lede')}
            </p>

            <div className="as-facts ld ld-4">
              {FACTS.map((f) => (
                <div className="as-fact" key={f.key}>
                  <span className="ic" style={{ background: f.color }}>
                    {f.glyph}
                  </span>
                  <div>
                    <b>{t(`as.${f.key}t`)}</b>
                    <span>{t(`as.${f.key}b`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ld ld-3">
            <AssessmentTool bands={bands} />
          </div>
        </div>
      </div>
    </header>

    <section className="band" style={{ paddingTop: 'clamp(48px,6vw,84px)' }}>
      <div className="shell">
        <Reveal className="sec-head mid">
          <span className="eyebrow">{t('as.out.eyebrow')}</span>
          <h2
            className="sec-h"
            style={{ maxWidth: '20ch' }}
            dangerouslySetInnerHTML={{ __html: t('as.out.h2') }}
          />
        </Reveal>
        <div className="paths" style={{ marginTop: 44 }}>
          {OUTCOMES.map((o, i) => (
            <Reveal
              key={o.n}
              as="article"
              className={`path${o.cls}`}
              delay={(i + 1) as 1 | 2 | 3}
              style={{
                ['--pc' as string]: o.colour,
                ...(o.ink ? { ['--pc-t' as string]: o.ink } : {}),
              }}
            >
              <h3>{t(`as.out.${o.n}t`)}</h3>
              <p>{t(`as.out.${o.n}b`)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
