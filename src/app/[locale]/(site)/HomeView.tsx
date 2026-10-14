'use client';

import Image from 'next/image';
import { L as Link } from '@/components/L';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { HeroQuiz } from '@/components/home/HeroQuiz';
import { WordHex } from '@/components/home/WordHex';
import { HiveGame } from '@/components/home/HiveGame';
import type { HiveGuide } from '@/components/home/hive/data';
import { ArticleTile } from '@/components/content/Cards';
import type { CardView } from '@/lib/content-format';

/* ---------------- stat rail ----------------
   Four facts about the programme. Three are counts; the fourth is the pair of
   languages, which is a fact of the same kind but not a number, so it is set
   as a lockup rather than faked into one. */

type Stat =
  | { kind: 'count'; key: string; value: number; suffix?: string }
  | { kind: 'pair'; key: string; lead: string; tail: string };

function statsFor(guides: number): Stat[] {
  return [
    { kind: 'count', key: 'stat.1', value: 100000, suffix: '+' },
    { kind: 'count', key: 'stat.2', value: guides },
    { kind: 'count', key: 'stat.3', value: 3 },
    { kind: 'pair', key: 'stat.4', lead: 'BM', tail: ' / EN' },
  ];
}

function useCountUp(target: number, run: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target);
      return;
    }
    const t0 = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      // ease-out so the last digits settle rather than snap
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n;
}

function StatCell({ item, run }: { item: Stat; run: boolean }) {
  const { t } = useLang();
  const n = useCountUp(item.kind === 'count' ? item.value : 0, run);
  return (
    <div className="stat">
      {item.kind === 'count' ? (
        <b className="tnum">
          {n.toLocaleString('en-MY')}
          {item.suffix}
        </b>
      ) : (
        <b>
          {item.lead}
          <i>{item.tail}</i>
        </b>
      )}
      <span>{t(item.key)}</span>
    </div>
  );
}

function StatRail({ guides }: { guides: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="statrail" ref={ref}>
      <div className="statrail-in">
        {statsFor(guides).map((s) => (
          <StatCell key={s.key} item={s} run={run} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- pathways ---------------- */

const PATHS = [
  { n: 1, cls: '', colour: 'var(--jade)', track: 1 },
  { n: 2, cls: ' s2', colour: 'var(--magenta)', track: 2 },
  { n: 3, cls: ' s3', colour: 'var(--saffron)', track: 3 },
];

function Pathways() {
  const { t } = useLang();
  return (
    <section className="band" id="pathways" data-section="pathways">
      <div className="shell">
        <Reveal className="sec-head">
          <span className="eyebrow">{t('path.eyebrow')}</span>
          <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('path.h2') }} />
          <p className="sec-sub">{t('path.sub')}</p>
        </Reveal>

        <div className="paths">
          {PATHS.map((p, i) => (
            <Reveal
              key={p.n}
              className={`path${p.cls}`}
              delay={(i + 1) as 1 | 2 | 3}
              style={{ ['--pc' as string]: p.colour }}
            >
              <div className="p-track" aria-hidden="true">
                {[1, 2, 3].map((s) => (
                  <i key={s} className={s <= p.track ? 'on' : undefined} />
                ))}
              </div>
              <h3>{t(`path.${p.n}t`)}</h3>
              <span className="band-label">{t(`path.${p.n}f`)}</span>
              <p>{t(`path.${p.n}b`)}</p>
              <ul>
                {t(`path.${p.n}l`)
                  .split('|')
                  .map((line, k) => (
                    <li key={k}>{line}</li>
                  ))}
              </ul>
              {/* The arrow goes inside the link, not beside it. Sitting
                  outside it read as part of the call to action and was the one
                  part of it that could not be clicked - the same trap as the
                  financing ledger's dead "Ketahui lagi", in a milder form. */}
              <div className="path-foot">
                <Link href="/assessment">
                  {t('path.cta')} <span className="arw">&#8594;</span>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- how it works ---------------- */

function Steps() {
  const { t } = useLang();
  return (
    <section className="band band-dark band-steps" data-section="steps">
      <div className="shell">
        <Reveal className="sec-head">
          <span className="eyebrow">{t('how.eyebrow')}</span>
          <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('how.h2') }} />
        </Reveal>
        <div className="steps">
          {[1, 2, 3].map((n) => (
            <Reveal className="step" key={n} delay={n as 1 | 2 | 3}>
              <span className="n">{String(n).padStart(2, '0')}</span>
              <h3>{t(`how.${n}t`)}</h3>
              <p>{t(`how.${n}b`)}</p>
              <span className="meta">{t(`how.${n}m`)}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- mentorship split ---------------- */

function MentorSplit() {
  const { t } = useLang();
  return (
    <section className="band" data-section="mentor">
      <div className="shell">
        <div className="split">
          <Reveal className="split-art">
            <div className="split-frame">
              <Image
                src="/img/mentor-portrait.webp"
                alt={t('men.imgAlt')}
                width={620}
                height={775}
              />
            </div>
            <div className="split-tag">
              <div className="av" aria-hidden="true">
                <i style={{ background: 'var(--plum)' }} />
                <i style={{ background: 'var(--magenta)' }} />
                <i style={{ background: 'var(--saffron)' }} />
              </div>
              <b>{t('men.tag1')}</b>
              <span>{t('men.tag2')}</span>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="eyebrow">{t('men.eyebrow')}</span>
              <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('men.h2') }} />
              <p className="sec-sub">{t('men.sub')}</p>
            </div>
            <div className="bens">
              {[1, 2, 3].map((n) => (
                <div className="ben" key={n}>
                  <span className="bn tnum">{String(n).padStart(2, '0')}</span>
                  <div>
                    <h3>{t(`men.${n}t`)}</h3>
                    <p>{t(`men.${n}b`)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="btn btn-solid" href="/mentorship" style={{ marginTop: 26 }}>
              <span>{t('men.cta')}</span> <span className="arw">&#8594;</span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- page ---------------- */

export function HomeView({
  latest,
  total,
  guides,
  hive,
}: {
  latest: CardView[];
  total: number;
  guides: number;
  hive: HiveGuide[];
}) {
  const { t } = useLang();

  return (
    <>
      <header className="hero" data-section="hero">
        <div className="hero-bg" aria-hidden="true">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
          <span className="blob blob-4" />
          <span className="blob blob-5" />
        </div>
        <div className="hero-veil" aria-hidden="true" />

        <div className="shell">
          <div className="hero-grid">
            <div>
              <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
                {t('hero.eyebrow')}
              </span>
              <h1 className="hero-h ld ld-2" dangerouslySetInnerHTML={{ __html: t('hero.h1') }} />
              <p className="hero-lede ld ld-3">{t('hero.lede')}</p>
              <div className="ld ld-4">
                <HeroQuiz />
              </div>
              <div className="hero-acts ld ld-5">
                <Link className="btn btn-ghost" href="#pathways">
                  <span>{t('hero.cta2')}</span> <span className="arw">&#8594;</span>
                </Link>
              </div>
            </div>

            {/* no `ld` on the wrapper: each piece runs its own entrance, and a
                fade on the parent would compound with all three */}
            <div className="hero-art">
              <div className="hero-slab" aria-hidden="true" />
              <div className="hero-frame">
                <Image
                  src="/img/hero-welcome.webp"
                  alt={t('hero.imgAlt')}
                  width={860}
                  height={1075}
                  priority
                />
              </div>
              {/* the stat rail states this same figure a few lines below, so
                  the tag is decoration as far as a screen reader is concerned */}
              <div className="hero-tag" aria-hidden="true">
                <b className="tnum">100k</b>
                <span>{t('hero.tag')}</span>
              </div>
            </div>
          </div>

          <StatRail guides={guides} />
        </div>
      </header>

      {/* Platform coverage. The heading lives inside WordHex: above the
          breakpoint it sits in the middle of the hexagon the words form. */}
      <section data-section="field"
        className="band"
        style={{ paddingTop: 'clamp(52px,6vw,80px)', paddingBottom: 'clamp(30px,3.6vw,56px)' }}
      >
        <div className="shell">
          <WordHex />
        </div>
      </section>

      <Pathways />
      {/* after the pathways, which name the three stages the game builds */}
      <HiveGame guides={hive} />
      <Steps />
      <MentorSplit />

      <section className="band band-shell" data-section="guides">
        <div className="shell">
          <Reveal
            className="sec-head"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 24,
              maxWidth: 'none',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: '56ch' }}>
              <span className="eyebrow">{t('res.eyebrow')}</span>
              <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('res.h2') }} />
            </div>
            <Link className="btn btn-ghost btn-sm" href="/resources">
              <span>{t('res.all', { n: total })}</span> <span className="arw">&#8594;</span>
            </Link>
          </Reveal>

          {/* the reveal wraps the grid, not each card: wrapping each one put
              a div between the grid and the card, so the cards stopped
              stretching to a shared height */}
          <Reveal className="res">
            {latest.map((item) => (
              <ArticleTile key={item.id} item={item} />
            ))}
          </Reveal>
        </div>
      </section>

      <section className="rd-band" data-section="rakyat">
        <div className="shell">
          <Reveal className="rd">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="eyebrow">{t('rd.eyebrow')}</span>
              <h2>{t('rd.h2')}</h2>
              <p>{t('rd.p')}</p>
              <a
                className="btn btn-light"
                href="https://rakyatdigital.gov.my"
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 26 }}
              >
                <span>{t('rd.cta')}</span> <span className="arw">&#8594;</span>
              </a>
            </div>
            <div className="rd-art">
              <div className="rd-plate">
                <Image
                  src="/img/rakyat-digital.webp"
                  alt="Rakyat Digital &mdash; Kementerian Digital"
                  width={228}
                  height={84}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
