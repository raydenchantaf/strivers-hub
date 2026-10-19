'use client';

import { L as Link } from '@/components/L';
import { useLang } from '@/components/LangProvider';
import { MAX_SCORE } from '@/lib/assessment/scoring';
import type { Band } from '@/lib/assessment/types';
import { formatDate, type CardView } from '@/lib/content-format';

/** `onRetake` is present inside the tool, where retaking is a state change.
 *  On the standalone /results route there is nothing to reset, so the same
 *  action is a link back to the assessment.
 *
 *  `takenAt` is set only when this result was restored from a previous visit.
 *  Without it a returning visitor lands on a result screen where they expected
 *  a quiz and has no way to tell whether the site remembered them or simply
 *  failed to start. */
export function ResultView({
  band,
  score,
  takenAt,
  onRetake,
  save,
  recommended,
  ctaHref = '/resources',
}: {
  band: Band;
  score: number;
  takenAt?: string | null;
  onRetake?: () => void;
  /** The offer to keep this result in an account: one line, under the main
   *  call to action rather than above it. Above it, a second solid button
   *  competed with the one the page actually wants pressed. */
  save?: React.ReactNode;
  /** Articles for this stage. Given, they replace the button to all
   *  resources: the end of the assessment is where a visitor is readiest to
   *  start, so it shows them where (TAF, 18 Oct). */
  recommended?: CardView[];
  /** Where the button goes when there is no list here, e.g. down to the
   *  recommendations further down /results. */
  ctaHref?: string;
}) {
  const { lang, t, p } = useLang();
  const steps = band.steps[lang] ?? band.steps.en ?? [];
  const when = takenAt ? formatDate(takenAt, lang) : '';

  return (
    <div className="result">
      <div className="rhex" style={{ background: band.color }}>
        <b className="tnum">{score}</b>
        <span>/ {MAX_SCORE}</span>
      </div>

      {when ? <p className="rsaved">{t('as.result.saved', { d: when })}</p> : null}

      <h3>{band.title[lang]}</h3>
      <span className="rband" style={{ background: `${band.color}1A`, color: band.color }}>
        {band.key[lang]}
      </span>

      {band.desc[lang]
        .split('\n')
        .filter(Boolean)
        .map((para, i) => (
          <p key={i}>{para}</p>
        ))}

      {steps.length ? (
        <div className="rrecs">
          {steps.map((s, i) => (
            <div className="rrec" key={i}>
              <i aria-hidden="true" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      ) : null}

      {recommended?.length ? (
        <div className="rres">
          <span className="rres-h">{t('as.result.recH')}</span>
          <ul>
            {recommended.map((item) => (
              <li key={item.id}>
                <Link className="rres-i" href={item.href} data-track="guide" data-label={item.title.en}>
                  {/* cropped, not shown whole: at this size a whole banner is a
                      thin strip, and the title beside it says what it is */}
                  <span className="rres-img">
                    {item.img.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.img.thumb} alt="" width={160} height={104} loading="lazy" />
                    ) : null}
                  </span>
                  <span className="rres-tx">
                    {item.categories[0] ? <span className="rres-cat">{p(item.categories[0])}</span> : null}
                    <b>{p(item.title)}</b>
                  </span>
                  <span className="arw" aria-hidden="true">&#8594;</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="rres-all" href="/resources">
            {t('as.result.all')} <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
      ) : ctaHref.startsWith('#') ? (
        <a className="btn btn-solid" href={ctaHref}>
          <span>{t('as.result.cta')}</span> <span className="arw">&#8594;</span>
        </a>
      ) : (
        <Link className="btn btn-solid" href={ctaHref}>
          <span>{t('as.result.cta')}</span> <span className="arw">&#8594;</span>
        </Link>
      )}

      {save}
      {/* `retake`, not `skip`: `.skip` belongs to the site's skip-to-content
          link, which the stylesheet parks at left:-9999px and only reveals on
          keyboard focus. Sharing the name put this button 9999px off the side
          of the page - present, clickable by script, invisible to everyone. */}
      <div>
        {onRetake ? (
          <button className="retake" type="button" onClick={onRetake}>
            {t('as.restart')}
          </button>
        ) : (
          <Link className="retake" href="/assessment">
            {t('as.restart')}
          </Link>
        )}
      </div>
    </div>
  );
}
