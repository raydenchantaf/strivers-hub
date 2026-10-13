'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { questions, sections, FIRST_QUESTION } from '@/lib/assessment/questions';
import {
  bandOf,
  isAnswered,
  nextIdFor,
  progressOf,
  readableAnswers,
  scoreOf,
} from '@/lib/assessment/scoring';
import type { Answer, Answers, Band } from '@/lib/assessment/types';
import { clearOutcome, readOutcome, saveOutcome } from '@/lib/assessment/outcome';
import { SaveResult } from './SaveResult';
import { SaveResultDialog } from './SaveResultDialog';
import { ProgressRing } from './ProgressRing';
import { QuestionView } from './QuestionView';
import { ResultView } from './ResultView';
import { track } from '@/lib/analytics/client';

const PROGRESS_KEY = 'sh_progress';

type Phase = 'consent' | 'quiz' | 'result';

type Saved = {
  currentId: string;
  history: string[];
  answers: Answers;
  otherTexts: Record<string, string>;
  fieldValues: Record<string, string>;
  consented: boolean;
};

/**
 * The assessment itself. Twenty-five questions, two branches, six question
 * types, and a scoring model that only three of them feed.
 *
 * Two different things are remembered, and they have different lifetimes.
 * Progress - the half-finished quiz - is in sessionStorage, because it only
 * has to survive a refresh or the trip from the homepage's three-question
 * opener. A finished result is in localStorage, because someone who comes
 * back a month later should be shown what they scored rather than being made
 * to sit the whole thing again. Retaking is then an explicit choice, and the
 * button on the result screen is where it is made.
 */
/**
 * Animates the panel between the heights its questions actually need.
 * A ResizeObserver rather than a render-time measurement, because the content
 * also changes height inside a question - the "please specify" box appears,
 * an option wraps to two lines - and those should glide too.
 *
 * The measured height is written straight to the element rather than held in
 * state. It used to be `useState`, which meant every observation re-rendered
 * the whole tool - the question, its options, the nav - in the middle of the
 * transition those observations belong to. A height transition already asks
 * the main thread for a layout on every frame; asking it to reconcile React
 * as well, on the frame the new question mounts, is how a transition loses
 * one. Nothing renders from this value, so nothing needs to know it changed.
 */
function useFlowHeight() {
  const box = useRef<HTMLDivElement>(null);

  /* A callback ref rather than useEffect: the measured element only exists
     once the visitor is past the consent screen, and an effect with an empty
     dependency list would have run before it was ever in the tree. React 19
     runs the returned cleanup when the node goes away. */
  const inner = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const apply = () => {
      const outer = box.current;
      if (outer) outer.style.height = `${el.getBoundingClientRect().height}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { inner, box };
}

export function AssessmentTool({ bands }: { bands: Band[] }) {
  const { t, lang } = useLang();
  const panelRef = useRef<HTMLDivElement>(null);
  const flow = useFlowHeight();

  const [phase, setPhase] = useState<Phase>('consent');
  const [agreed, setAgreed] = useState(false);
  const [currentId, setCurrentId] = useState(FIRST_QUESTION);
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; bandIndex: number } | null>(null);
  const [restored, setRestored] = useState(false);
  const [takenAt, setTakenAt] = useState<string | null>(null);
  /* The assessment response's id in the CMS, and whether it is already tied to
     an account. Both come back from the submit call and are kept in the stored
     outcome, so the offer to save survives a later visit. */
  const [resultId, setResultId] = useState<string | undefined>(undefined);
  const [resultSaved, setResultSaved] = useState(false);
  /* The prompt has two ways of opening and they are not the same thing.
     'gate' is the one raised automatically on a freshly earned result, and it
     holds the result back behind it until it is dismissed. 'reopen' is the
     visitor asking for it again from the line under the result, by which
     point they have already seen their score - hiding it a second time would
     be taking something back. */
  const [promptMode, setPromptMode] = useState<null | 'gate' | 'reopen'>(null);
  const prompt = promptMode !== null;
  /* The question being left, kept mounted just long enough to fade out under
     the one arriving. See the note above the render. */
  const [leaving, setLeaving] = useState<string | null>(null);

  /* ---- restore a finished result, or failing that an unfinished attempt ---- */
  useEffect(() => {
    /* A saved result wins over saved progress. It cannot normally be both -
       submitting clears the progress - but a visitor who started again and
       wandered off mid-quiz would have the two side by side, and showing the
       result they actually have beats dropping them back into a half-finished
       second attempt they had already abandoned. */
    const done = readOutcome();
    if (done) {
      const index = bands.indexOf(bandOf(done.score, bands));
      if (index > -1) {
        setResult({ score: done.score, bandIndex: index });
        setTakenAt(done.takenAt);
        setResultId(done.id);
        setResultSaved(done.saved === true);
        setAgreed(true);
        setPhase('result');
        setRestored(true);
        return;
      }
    }

    try {
      const raw = sessionStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Saved>;
        if (s.answers) setAnswers(s.answers);
        if (s.otherTexts) setOtherTexts(s.otherTexts);
        if (s.fieldValues) setFieldValues(s.fieldValues);
        if (Array.isArray(s.history)) setHistory(s.history);
        if (s.currentId && questions[s.currentId]) setCurrentId(s.currentId);
        if (s.consented) {
          setAgreed(true);
          setPhase('quiz');
        }
      }
    } catch {
      /* a private window with storage blocked simply starts fresh */
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      /* Once it has been submitted there is nothing left to resume, and
         saving it would undo the clear that submit() just did - this effect
         re-runs the moment `phase` becomes 'result', with every answer still
         in state. Consent is kept so a visitor who starts again in the same
         session is not asked for it twice. */
      if (phase === 'result') {
        sessionStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({
            currentId: FIRST_QUESTION,
            history: [],
            answers: {},
            otherTexts: {},
            fieldValues: {},
            consented: true,
          } satisfies Saved),
        );
        return;
      }
      const payload: Saved = {
        currentId,
        history,
        answers,
        otherTexts,
        fieldValues,
        consented: phase !== 'consent',
      };
      sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [restored, currentId, history, answers, otherTexts, fieldValues, phase]);

  const q = questions[currentId];
  const value = answers[currentId];
  const otherText = otherTexts[currentId] ?? '';
  const canAdvance = q ? isAnswered(q, value, otherText, fieldValues) : false;

  /* which of the five sections she has reached: where the insights page sees
     people stop part-way through */
  const lastSection = useRef<string | null>(null);
  const section = phase === 'quiz' ? q?.section : undefined;
  useEffect(() => {
    if (!section || lastSection.current === section) return;
    lastSection.current = section;
    track('quiz', { s: 'sec', n: section });
  }, [section]);
  const progress = useMemo(() => progressOf(history, currentId), [history, currentId]);
  const isLast = q?.next === '[END]';

  /* With reduced motion there is no crossfade to run, so the outgoing copy
     would be hidden by CSS and its animationend would never fire to clear
     this state. Simpler not to hand it over in the first place. */
  const handOver = useCallback((from: string) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setLeaving(from);
  }, []);

  /* Pressing Next has to put the next question at the top of the viewport;
     without this the visitor lands mid-panel and has to scroll up to read. */
  const scrollToPanel = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const setAnswer = useCallback(
    (v: Answer) => setAnswers((a) => ({ ...a, [currentId]: v })),
    [currentId],
  );

  async function submit() {
    setSubmitting(true);
    const score = scoreOf(answers);
    const band = bandOf(score, bands);
    const payload = {
      language: lang,
      score,
      category: band.key.en,
      firstName: fieldValues.q5g ?? '',
      lastName: fieldValues.q5h ?? '',
      email: fieldValues.q5i ?? '',
      phone: fieldValues.q5j ?? '',
      consent: agreed,
      answers: readableAnswers(answers, lang, otherTexts),
    };
    let id: string | undefined;
    let alreadySaved = false;
    try {
      const res = await fetch('/api/submit-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; saved?: boolean };
      id = typeof json.id === 'string' ? json.id : undefined;
      alreadySaved = json.saved === true;
    } catch {
      /* a failed write must not cost the visitor their result */
    }
    setResultId(id);
    setResultSaved(alreadySaved);
    /* Offered whenever there is an account to be made - not only when the
       response reached the CMS. Creating the account never depended on that
       id; only attaching the result to it does, and a result that could not
       be written is a reason to lose the link, not a reason to withhold the
       account. Gating on the id meant that on any environment without a write
       token the prompt silently never appeared. */
    setPromptMode(alreadySaved ? null : 'gate');
    track('quiz', { s: 'done', band: band.key.en, score });
    if (!alreadySaved) track('quiz', { s: 'offer' });
    try {
      sessionStorage.removeItem(PROGRESS_KEY);
    } catch {
      /* ignore */
    }
    /* Keeps the score in localStorage and in the cookie `/results` reads. Not
       httpOnly on purpose: it is a score out of 18, not a credential, and the
       page it feeds is the one the visitor has just earned. */
    saveOutcome(score, id, alreadySaved);
    /* takenAt stays null here on purpose: it is what tells the result screen
       it is showing something restored from a previous visit, and this one
       was just earned. */
    setResult({ score, bandIndex: bands.indexOf(band) });
    setPhase('result');
    setSubmitting(false);
    scrollToPanel();
  }

  function next() {
    if (!q || !canAdvance) return;
    if (q.type === 'multi-text') {
      setAnswers((a) => {
        const merged = { ...a };
        for (const f of q.fields ?? []) merged[f.id] = (fieldValues[f.id] ?? '').trim();
        return merged;
      });
    }
    if (isLast) {
      void submit();
      return;
    }
    const target = q.type === 'multi-text' ? q.next : nextIdFor(q, value);
    handOver(currentId);
    setHistory((h) => [...h, currentId]);
    setCurrentId(target);
    scrollToPanel();
  }

  function back() {
    setHistory((h) => {
      if (!h.length) return h;
      const copy = [...h];
      const prev = copy.pop() as string;
      handOver(currentId);
      setCurrentId(prev);
      return copy;
    });
    scrollToPanel();
  }

  /**
   * Throw the saved result away and start again.
   *
   * The stored outcome has to go, not just the React state - otherwise the
   * next visit would restore the very result the visitor has just chosen to
   * retake. `/results` reads the same cookie, so it stops showing the old
   * band too, which is right: a score someone has explicitly discarded should
   * not keep being presented back to them as theirs.
   *
   * Consent is deliberately kept. It was given once, and asking again in the
   * same breath would read as the form not having listened.
   */
  function retake() {
    setAnswers({});
    setOtherTexts({});
    setFieldValues({});
    setHistory([]);
    setCurrentId(FIRST_QUESTION);
    setResult(null);
    setTakenAt(null);
    setResultId(undefined);
    setResultSaved(false);
    setPromptMode(null);
    try {
      sessionStorage.removeItem(PROGRESS_KEY);
    } catch {
      /* storage blocked - the state reset above is what matters */
    }
    clearOutcome();
    setPhase('quiz');
    track('quiz', { s: 'retake' });
    scrollToPanel();
  }


  /* ---------------- render ---------------- */

  if (phase === 'result' && result) {
    return (
      <div className="quiz" ref={panelRef}>
        <div className="quiz-top">
          <ProgressRing value={1} />
          <div>
            <div className="sect">{t('as.done.sect')}</div>
            <div className="qn">{t('as.done.step')}</div>
          </div>
        </div>
        {/* While the prompt is up the result is held back behind it - veiled,
            not removed, so the panel keeps its height and nothing jumps when
            it clears. `inert` takes it out of the tab order and the
            accessibility tree for as long as it is hidden, so a screen reader
            is not reading out a score the screen is not showing. */}
        {/* Outside the veiled region on purpose: `inert` applies to
            everything inside the element that carries it, and a dialog inside
            it would be inert too - visible, and refusing every click. */}
        {prompt ? (
          <SaveResultDialog
            resultId={resultId}
            prefill={{
              name: [fieldValues.q5g, fieldValues.q5h].filter(Boolean).join(' ').trim(),
              email: fieldValues.q5i ?? '',
              phone: fieldValues.q5j ?? '',
            }}
            onClose={() => setPromptMode(null)}
          />
        ) : null}
        <div
          className={`quiz-body${promptMode === 'gate' ? ' is-veiled' : ''}`}
          {...(promptMode === 'gate' ? { inert: true } : {})}
        >
          <ResultView
            band={bands[result.bandIndex]}
            score={result.score}
            takenAt={takenAt}
            onRetake={retake}
            save={
              /* Already attached - the visitor was signed in when they
                 submitted - so there is nothing to offer. */
              resultSaved ? null : <SaveResult onOpen={() => setPromptMode('reopen')} />
            }
          />
        </div>
      </div>
    );
  }

  if (phase === 'consent') {
    return (
      <div className="quiz" ref={panelRef}>
        <div className="quiz-top">
          <ProgressRing value={0} />
          <div>
            <div className="sect">{t('as.consent.sect')}</div>
            <div className="qn">{t('as.consent.h')}</div>
          </div>
        </div>
        <div className="quiz-body consent">
          <p>{t('as.consent.p1')}</p>
          <p>{t('as.consent.p2')}</p>
          <label className={`agree${agreed ? ' on' : ''}`}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>{t('as.consent.agree')}</span>
          </label>
          <div className="quiz-nav">
            <span className="savenote">{t('as.saved')}</span>
            <span className="spacer" />
            <button
              className="btn btn-solid"
              type="button"
              disabled={!agreed}
              onClick={() => {
                setPhase('quiz');
                track('quiz', { s: 'start' });
                scrollToPanel();
              }}
            >
              <span>{t('as.consent.cta')}</span> <span className="arw">&#8594;</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const sectionLabel = sections[q.section]?.[lang] ?? q.section;
  const index = history.length + 1;
  const total = history.includes('q2b') || currentId === 'q2b' ? 21 : 24;

  return (
    <div className="quiz" ref={panelRef}>
      <div className="quiz-top">
        <ProgressRing value={progress} />
        <div>
          <div className="sect">{sectionLabel}</div>
          <div className="qn">
            {t('as.qof', { a: index, b: total })}
          </div>
        </div>
      </div>

      <div className="quiz-body">
        {/* The question that is leaving stays mounted, out of flow, fading
            under the one arriving.

            The comment on this transition always said the new step comes in
            "over the top of it", but `key={currentId}` replaces the node, so
            the old question was gone the instant the new one mounted and
            there was nothing underneath. For the first frames of every Next
            the panel held no question at all and you were looking at its own
            ground, which is lighter than the text on it - the white flash.
            Now the two overlap, the panel is never empty, and both halves of
            the crossfade are opacity and transform, which the compositor can
            run without the main thread. It is `inert` rather than merely
            aria-hidden because it still contains real controls for the ~220ms
            it lingers, and a keyboard should not be able to reach into a
            question that is on its way out. */}
        <div className="qflow" ref={flow.box}>
          <div ref={flow.inner}>
            {leaving && leaving !== currentId && questions[leaving] ? (
              <div
                className="qstep qstep-out"
                key={`out-${leaving}`}
                inert
                onAnimationEnd={() => setLeaving(null)}
              >
                <QuestionView
                  q={questions[leaving]}
                  value={answers[leaving]}
                  otherText={otherTexts[leaving] ?? ''}
                  fieldValues={fieldValues}
                  onChange={() => {}}
                  onOther={() => {}}
                  onField={() => {}}
                />
              </div>
            ) : null}
            <div className="qstep" key={currentId}>
              <QuestionView
                q={q}
                value={value}
                otherText={otherText}
                fieldValues={fieldValues}
                onChange={setAnswer}
                onOther={(text) => setOtherTexts((o) => ({ ...o, [currentId]: text }))}
                onField={(id, text) => setFieldValues((f) => ({ ...f, [id]: text }))}
              />
            </div>

            <div className="quiz-nav">
              {history.length ? (
                <button className="back" type="button" onClick={back}>
                  <span className="arw">&#8592;</span> {t('as.back')}
                </button>
              ) : null}
              <span className="savenote">{t('as.saved')}</span>
              <span className="spacer" />
              <button
                className="btn btn-solid"
                type="button"
                disabled={!canAdvance || submitting}
                onClick={next}
              >
                <span>{isLast ? t('as.submit') : t('as.next')}</span>{' '}
                <span className="arw">&#8594;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
