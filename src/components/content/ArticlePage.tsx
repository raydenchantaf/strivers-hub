'use client';

import { L as Link } from '@/components/L';
import { useEffect, useRef, useState } from 'react';
import type { PortableTextBlock } from '@portabletext/react';
import { useLang } from '@/components/LangProvider';
import { HeaderField } from '@/components/HeaderField';
import { formatDate, routeForKind, type CardView, type Kind } from '@/lib/content-format';
import { ArticleBody } from './Body';
import { ArticleTile } from './Cards';

const BACK_KEY: Record<Kind, string> = {
  resource: 'ar.back',
  event: 'ar.backEvents',
  financing: 'ar.backFin',
};

/** Reading progress across the body only, hidden when there is nothing to track. */
function useProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const span = el.offsetHeight - window.innerHeight * 0.55;
      if (span < 200) {
        setPct(0);
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY;
      const p = (window.scrollY - top + window.innerHeight * 0.55) / span;
      setPct(Math.max(0, Math.min(1, p)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);
  return pct;
}

export function ArticlePage({
  article,
  related,
  minutes,
}: {
  article: CardView & { body: { en: PortableTextBlock[]; bm: PortableTextBlock[] } };
  related: CardView[];
  minutes: { en: number; bm: number };
}) {
  const { p, t, lang } = useLang();
  const bodyRef = useRef<HTMLDivElement>(null);
  const pct = useProgress(bodyRef);

  return (
    <>
      <div className="ab-prog" style={{ width: `${pct * 100}%` }} aria-hidden="true" />

      <header className="ab-head">
        <HeaderField />
        <div className="shell">
          <Link className="ab-back" href={routeForKind[article.kind]}>
            <span className="arw">&#8592;</span> <span>{t(BACK_KEY[article.kind])}</span>
          </Link>
          <div className="ab-cats">
            {article.categories.slice(0, 3).map((c, i) => (
              <span key={c.en} className={`tag${i === 1 ? ' j' : i === 2 ? ' o' : ''}`}>
                {p(c)}
              </span>
            ))}
          </div>
          <h1>{p(article.title)}</h1>
          <div className="ab-meta">
            <span className="tnum">{formatDate(article.publishedAt, lang)}</span>
            <span className="ix-dot" />
            <span>
              {minutes[lang]} {t('ar.min')}
            </span>
            <span className="ix-dot" />
            <span>
              <b>{t('ar.by')}</b>
            </span>
          </div>
          {article.img.lead ? (
            <div className="ab-lead">
              <img
                src={article.img.lead}
                alt={article.img.alt}
                width={article.img.w}
                height={article.img.h}
                fetchPriority="high"
              />
            </div>
          ) : null}
        </div>
      </header>

      <section className="ab-wrap">
        <div className="shell">
          <div ref={bodyRef}>
            <ArticleBody body={article.body} />
          </div>
          <div className="ab-end">
            <p>{t('ar.endNote')}</p>
            <Link className="btn btn-ghost btn-sm" href="/assessment">
              <span>{t('ar.endCta')}</span> <span className="arw">&#8594;</span>
            </Link>
          </div>
        </div>
      </section>

      {related.length ? (
        <section
          className="band band-shell"
          style={{ paddingTop: 'clamp(44px,5vw,72px)', paddingBottom: 'clamp(44px,5vw,72px)' }}
        >
          <div className="shell">
            <div className="sec-head" style={{ maxWidth: 'none' }}>
              <span className="eyebrow">{t('ar.relEyebrow')}</span>
              <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('ar.relH') }} />
            </div>
            <div className="ab-rel">
              {related.map((r) => (
                <ArticleTile key={r.id} item={r} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
