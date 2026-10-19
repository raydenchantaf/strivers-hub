'use client';

import { L as Link } from '@/components/L';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { ResultView } from '@/components/assessment/ResultView';
import { ArticleTile } from '@/components/content/Cards';
import { formatDate } from '@/lib/content-format';
import type { Band } from '@/lib/assessment/types';
import type { CardView } from '@/lib/content-format';

export function ResultsView({
  band,
  score,
  takenAt,
  recommended,
}: {
  band: Band | null;
  score: number | null;
  takenAt: string | null;
  recommended: CardView[];
}) {
  const { t, lang } = useLang();

  /* No score: the honest empty state. This is the case the live platform
     answers with a fabricated band. */
  if (band === null || score === null) {
    return (
      <header className="phead" style={{ paddingBottom: 'clamp(64px,7vw,104px)' }}>
        <HeaderField />
        <div className="shell">
          <div className="auth-solo">
            <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
              {t('rs.eyebrow')}
            </span>
            <h1 className="ld ld-2">{t('rs.emptyH')}</h1>
            <p className="lede ld ld-3">{t('rs.emptyP')}</p>
            <div className="ld ld-4" style={{ marginTop: 28 }}>
              <Link className="btn btn-solid" href="/assessment">
                <span>{t('rs.take')}</span> <span className="arw">&#8594;</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(26px,3vw,40px)' }}>
        <HeaderField />
        <div className="shell">
          <div className="phead-grid">
            <div>
              <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
                {t('rs.eyebrow')}
              </span>
              <h1 className="ld ld-2">{t('rs.h1')}</h1>
              {takenAt ? (
                <p className="lede ld ld-3">
                  {t('rs.taken')} {formatDate(takenAt, lang)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="shell">
          <div className="qpanel" style={{ maxWidth: 760, marginInline: 'auto' }}>
            <ResultView band={band} score={score} ctaHref={recommended.length ? '#recommended' : '/resources'} />
          </div>
        </div>
      </section>

      {recommended.length ? (
        <section id="recommended" className="band band-shell" style={{ paddingTop: 'clamp(44px,5vw,70px)' }}>
          <div className="shell">
            <Reveal className="sec-head mid">
              <span className="eyebrow">{t('rs.recEyebrow')}</span>
              <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('rs.recH') }} />
              <p className="sec-sub">{t('rs.recP')}</p>
            </Reveal>
            <Reveal className="res">
              {recommended.map((item) => (
                <ArticleTile key={item.id} item={item} />
              ))}
            </Reveal>
            <div style={{ textAlign: 'center', marginTop: 'clamp(26px,3vw,40px)' }}>
              <Link className="btn btn-ghost" href="/resources">
                <span>{t('rs.all')}</span> <span className="arw">&#8594;</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
