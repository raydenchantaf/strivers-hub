'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { questions } from '@/lib/assessment/questions';
import { clearOutcome } from '@/lib/assessment/outcome';

/** The first three real questions, not a teaser. */
const HERO_QUESTIONS = ['q1', 'q3a', 'q3c'] as const;
const REMAINING = 21;

/**
 * The visitor answers three genuine questions in the hero and arrives at the
 * assessment already a third of the way in, with those answers carried across
 * in sessionStorage. It is the same storage key the tool restores from.
 */
export function HeroQuiz() {
  const { p, t, locale } = useLang();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [leaving, setLeaving] = useState(false);

  const done = step >= HERO_QUESTIONS.length;
  const id = HERO_QUESTIONS[Math.min(step, HERO_QUESTIONS.length - 1)];
  const q = questions[id];
  const pct = Math.round((step / HERO_QUESTIONS.length) * 100);

  function choose(optionId: string) {
    setAnswers((a) => ({ ...a, [id]: optionId }));
    // let the tick land before moving on
    setTimeout(() => setStep((s) => s + 1), 190);
  }

  function go() {
    setLeaving(true);
    /* Answering the opener is starting the assessment again, so a result from
       a previous visit has to go - otherwise the tool would restore it and
       these three answers would vanish into a result screen. */
    clearOutcome();
    try {
      sessionStorage.setItem(
        'sh_progress',
        JSON.stringify({
          currentId: 'q1',
          history: [],
          answers,
          otherTexts: {},
          fieldValues: {},
          consented: false,
        }),
      );
    } catch {
      /* storage blocked - the assessment simply starts clean */
    }
    router.push(`/${locale}/assessment`);
  }

  if (done) {
    return (
      <div className="hq">
        <div className="hq-top">
          <span className="hq-step">{t('hero.qfoot')}</span>
          <span className="hq-bar" aria-hidden="true">
            <i style={{ width: '100%' }} />
          </span>
        </div>
        <div className="hq-done">
          <div className="hq-tick" aria-hidden="true">
            &#10003;
          </div>
          <h3 dangerouslySetInnerHTML={{ __html: t('hero.done.h') }} />
          <p>{t('hero.done.p', { n: REMAINING })}</p>
          <button className="btn btn-solid" type="button" onClick={go} disabled={leaving}>
            <span>{t('hero.done.cta')}</span> <span className="arw">&#8594;</span>
          </button>
          <button
            className="hq-restart"
            type="button"
            onClick={() => {
              setAnswers({});
              setStep(0);
            }}
          >
            {t('hero.restart')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hq">
      <div className="hq-top">
        <span className="hq-step">
          {t('as.qof', { a: step + 1, b: HERO_QUESTIONS.length })}
        </span>
        <span className="hq-bar" aria-hidden="true">
          <i style={{ width: `${Math.max(pct, 4)}%` }} />
        </span>
      </div>

      <h2 className="hq-q">{p(q.text)}</h2>
      <div className="hq-opts">
        {(q.options ?? []).map((o) => (
          <button
            key={o.id}
            type="button"
            className={`hq-opt${answers[id] === o.id ? ' sel' : ''}`}
            onClick={() => choose(o.id)}
          >
            <span className="tick" aria-hidden="true" />
            {p(o.label)}
          </button>
        ))}
      </div>

      {step > 0 ? (
        <button className="hq-back" type="button" onClick={() => setStep((s) => s - 1)}>
          <span className="arw">&#8592;</span> {t('hero.back')}
        </button>
      ) : (
        <p className="hq-foot">{t('hero.qfoot')}</p>
      )}
    </div>
  );
}
