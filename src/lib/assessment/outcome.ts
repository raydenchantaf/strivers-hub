import { MAX_SCORE } from './scoring';

/**
 * A finished assessment, kept so a visitor who comes back is shown what they
 * scored rather than being made to take it again.
 *
 * Deliberately not sessionStorage, which is where the half-finished quiz
 * lives: progress only has to survive a refresh, but a result has to survive
 * closing the tab. Deliberately not the answers either - once it has been
 * submitted and scored, the only thing worth keeping is the number.
 *
 * The cookie is the same value again, because `/results` is a server
 * component and cannot read localStorage. Both are cleared together, so the
 * two never disagree about whether a result exists.
 */

const KEY = 'sh_outcome';
const COOKIE = 'sh_result';
const DAYS = 180;

/** `id` is the assessment response's id in the CMS, kept so the result screen
 *  can still offer to attach it to a new account on a later visit. Absent when
 *  the write failed, which is allowed: the visitor keeps their result either
 *  way, they just cannot save it to an account. */
export type Outcome = { score: number; takenAt: string; id?: string; saved?: boolean };

/** Range-checked on the way out: it is a client value and a visitor can edit
 *  it, and a score outside the band table would render nothing. */
export function readOutcome(): Outcome | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<Outcome>;
    if (typeof o.score !== 'number' || !Number.isInteger(o.score)) return null;
    if (o.score < 0 || o.score > MAX_SCORE) return null;
    return {
      score: o.score,
      takenAt: typeof o.takenAt === 'string' ? o.takenAt : '',
      id: typeof o.id === 'string' && o.id ? o.id : undefined,
      saved: o.saved === true,
    };
  } catch {
    /* private window, storage disabled - there is simply no saved result */
    return null;
  }
}

export function saveOutcome(score: number, id?: string, saved = false): Outcome {
  const outcome: Outcome = { score, takenAt: new Date().toISOString(), id, saved };
  try {
    localStorage.setItem(KEY, JSON.stringify(outcome));
    sessionStorage.setItem('sh_score', String(score));
    document.cookie = `${COOKIE}=${score}; path=/; max-age=${DAYS * 86400}; samesite=lax`;
  } catch {
    /* the result is still in React state, so this visit is unaffected */
  }
  return outcome;
}

/** Called once the visitor has registered around this result: the offer to
 *  save it should not come back on the next visit. */
export function markOutcomeSaved(): void {
  try {
    const o = readOutcome();
    if (o) localStorage.setItem(KEY, JSON.stringify({ ...o, saved: true }));
  } catch {
    /* nothing stored, nothing to mark */
  }
}

/** Forget the result everywhere it is held. Both callers - the retake button
 *  and the homepage opener - mean the same thing by it: this person is
 *  starting again, so the old score should stop following them around. */
export function clearOutcome(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem('sh_score');
    document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch {
    /* nothing was stored in the first place */
  }
}
