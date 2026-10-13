'use client';

import { L as Link } from '@/components/L';
import { useRouter } from 'next/navigation';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { ArticleTile } from '@/components/content/Cards';
import { MAX_SCORE } from '@/lib/assessment/scoring';
import type { Band } from '@/lib/assessment/types';
import { formatDate, type CardView } from '@/lib/content-format';

export function DashboardView({
  name,
  score,
  band,
  takenAt,
  recommended,
}: {
  name: string;
  score: number | null;
  band: Band | null;
  takenAt: string | null;
  recommended: CardView[];
}) {
  const { t, lang, locale } = useLang();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(40px,4.6vw,64px)' }}>
        <HeaderField />
        <div className="shell">
          <div className="phead-grid">
            <div>
              <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
                {t('db.eyebrow')}
              </span>
              <h1 className="ld ld-2">
                {t('db.welcome')} <span className="serif-i">{name}</span>
              </h1>
            </div>
            <div className="ld ld-4 db-acts" style={{ alignSelf: 'end', paddingBottom: 6 }}>
              <Link className="btn btn-ghost btn-sm" href="/profile">
                {t('db.account')}
              </Link>
              <button className="btn btn-ghost btn-sm" type="button" onClick={logout}>
                {t('db.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 'clamp(34px,4vw,52px)' }}>
        <div className="shell">
          <Reveal className="wpanel" style={{ maxWidth: 620 }}>
            <span className="eyebrow" style={{ color: 'var(--magenta)' }}>
              {t('db.resultEyebrow')}
            </span>
            {band && score !== null ? (
              <>
                <h3>{band.title[lang]}</h3>
                <div className="ab-meta" style={{ marginTop: 14 }}>
                  <span className="rband" style={{ background: `${band.color}1A`, color: band.color }}>
                    {band.key[lang]}
                  </span>
                  <span className="ix-dot" />
                  <span className="tnum">
                    {score} / {MAX_SCORE}
                  </span>
                  {takenAt ? (
                    <>
                      <span className="ix-dot" />
                      <span className="tnum">{formatDate(takenAt, lang)}</span>
                    </>
                  ) : null}
                </div>
                <div className="db-acts">
                  <Link className="btn btn-solid btn-sm" href="/results">
                    <span>{t('db.seeResult')}</span> <span className="arw">&#8594;</span>
                  </Link>
                  <Link className="btn btn-ghost btn-sm" href="/assessment">
                    <span>{t('db.retake')}</span> <span className="arw">&#8594;</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3>{t('db.noneH')}</h3>
                <p>{t('db.noneP')}</p>
                <Link className="btn btn-solid" href="/assessment" style={{ marginTop: 20 }}>
                  <span>{t('db.take')}</span> <span className="arw">&#8594;</span>
                </Link>
              </>
            )}
          </Reveal>
        </div>
      </section>

      <section className="band band-shell" style={{ paddingTop: 'clamp(40px,4.6vw,64px)' }}>
        <div className="shell">
          <Reveal className="sec-head" style={{ maxWidth: 'none' }}>
            <span className="eyebrow">{t('db.recEyebrow')}</span>
            <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('db.recH') }} />
          </Reveal>
          <div className="res">
            {recommended.map((item) => (
              <ArticleTile key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
