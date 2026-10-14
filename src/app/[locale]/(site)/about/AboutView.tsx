'use client';

import Image from 'next/image';
import { L as Link } from '@/components/L';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import type { AboutContent } from '@/lib/pages';

/**
 * Every string here comes from `getAboutContent`, which resolves the CMS
 * document field by field and falls back to the bundled dictionary. The
 * arrangement is fixed; the words are not.
 */
/* Until TAF sets one on the About page in the Studio: their own photo from
   the SHE TECH Asia forum, already in their Sanity library. */
const FALLBACK_PHOTO =
  'https://cdn.sanity.io/images/9znzy5bd/production/55906504529bf9c324b63f9e8cc62f0dc0cc1896-1000x1334.jpg';

export function AboutView({ c }: { c: AboutContent }) {
  const { lang, t } = useLang();

  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(56px,6.5vw,92px)' }}>
        <HeaderField />
        <div className="shell">
          <div className="ab-hero">
            <div>
              <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
                {c.eyebrow[lang]}
              </span>
              <h1 className="ld ld-2" dangerouslySetInnerHTML={{ __html: c.headingHtml[lang] }} />
              <p className="lede ld ld-3">{c.lede[lang]}</p>
              <div className="ld ld-4" style={{ marginTop: 30 }}>
                <Link className="btn btn-solid" href="/assessment">
                  <span>{c.ctaLabel[lang]}</span> <span className="arw">&#8594;</span>
                </Link>
              </div>
            </div>
            <div className="ab-frame ld ld-3">
              <Image
                src={c.image?.src ?? FALLBACK_PHOTO}
                alt={c.image?.alt[lang] ?? t('ab.photoAlt')}
                width={c.image?.width ?? 1000}
                height={c.image?.height ?? 1334}
                priority
              />
            </div>
          </div>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 'clamp(34px,4vw,58px)' }}>
        <div className="shell">
          <Reveal className="sec-head" style={{ maxWidth: '56ch' }}>
            <span className="eyebrow">{c.whyEyebrow[lang]}</span>
            <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: c.whyHeadingHtml[lang] }} />
          </Reveal>
          <Reveal className="why">
            {c.why.map((w, i) => (
              <div className="wy" key={i}>
                <h3>{w.title[lang]}</h3>
                <p>{w.body[lang]}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section
        className="band band-shell"
        style={{ paddingTop: 'clamp(48px,5.5vw,80px)', paddingBottom: 'clamp(48px,5.5vw,80px)' }}
      >
        <div className="shell">
          <div className="split" style={{ alignItems: 'center' }}>
            <Reveal as="p" className="ab-quote">
              {c.quote[lang]}
            </Reveal>
            <Reveal as="p" className="sec-sub" delay={1} style={{ margin: 0 }}>
              {c.quoteSub[lang]}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="band band-dark band-lit" style={{ paddingBottom: 'clamp(52px,6vw,80px)' }}>
        <div className="shell">
          <Reveal className="sec-head" style={{ maxWidth: '54ch' }}>
            <span className="eyebrow">{c.rolesEyebrow[lang]}</span>
            <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: c.rolesHeadingHtml[lang] }} />
          </Reveal>
          <Reveal className="pill">
            {c.roles.map((p, i) => (
              <div className="pl" key={i}>
                <h3>{p.title[lang]}</h3>
                <p>{p.body[lang]}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}
