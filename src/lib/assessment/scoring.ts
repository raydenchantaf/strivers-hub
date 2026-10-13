import { questions } from './questions';
import { bands } from './bands';
import type { Answers, Band, Question } from './types';

/**
 * Three questions carry points. Everything else in the assessment is
 * collected for segmentation and recommendations but does not move the score.
 *
 *   q3a  stage of the journey        1-3
 *   q3b  training resources wanted   4-12   (exactly four of twelve options,
 *                                            four worth 1, four worth 2,
 *                                            four worth 3)
 *   q3c  online marketing maturity   1-3
 *
 * Total range is therefore 6-18, which matches the three bands exactly with
 * no gaps and no unreachable values. The four-selection rule on q3b is what
 * bounds the top of the range - without it the maximum would be 33.
 */
export const SCORED_QUESTIONS = ['q3a', 'q3b', 'q3c'] as const;

export const MIN_SCORE = 6;
export const MAX_SCORE = 18;

export function scoreOf(answers: Answers): number {
  let total = 0;
  for (const id of SCORED_QUESTIONS) {
    const q = questions[id];
    const given = answers[id];
    if (!q?.options || !given) continue;
    const chosen = Array.isArray(given) ? given : [given];
    for (const optionId of chosen) {
      total += q.options.find((o) => o.id === optionId)?.points ?? 0;
    }
  }
  return total;
}

/** The band a score falls in. `list` is the CMS set where one is loaded;
 *  it defaults to the bundled copy so client code and tests need not care. */
export function bandOf(score: number, list: Band[] = bands): Band {
  return list.find((b) => score >= b.min && score <= b.max) ?? list[0];
}

/** True when the current answer satisfies the question's own constraints. */
export function isAnswered(
  q: Question,
  value: Answers[string] | undefined,
  otherText: string,
  fieldValues: Record<string, string>,
): boolean {
  switch (q.type) {
    case 'multi': {
      if (!Array.isArray(value) || value.length === 0) return false;
      if (q.exactSelections && q.maxSelections) return value.length === q.maxSelections;
      if (needsOther(q, value) && !otherText.trim()) return false;
      return true;
    }
    case 'text':
      return typeof value === 'string' && value.trim().length > 0;
    case 'multi-text': {
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const f of q.fields ?? []) {
        const v = (fieldValues[f.id] ?? '').trim();
        if (f.required && !v) return false;
        if (f.inputType === 'email' && v && !email.test(v)) return false;
      }
      return true;
    }
    case 'likert':
      return typeof value === 'string' && value.length > 0;
    default: {
      if (typeof value !== 'string' || !value) return false;
      const opt = q.options?.find((o) => o.id === value);
      if (opt?.hasOther && !otherText.trim()) return false;
      return true;
    }
  }
}

export function needsOther(q: Question, value: Answers[string] | undefined): boolean {
  if (!q.options) return false;
  const chosen = Array.isArray(value) ? value : value ? [value] : [];
  return q.options.some((o) => o.hasOther && chosen.includes(o.id));
}

/** Where a given answer sends the visitor next. */
export function nextIdFor(q: Question, value: Answers[string] | undefined): string {
  if (typeof value === 'string') {
    const opt = q.options?.find((o) => o.id === value);
    if (opt?.next) return opt.next;
  }
  return q.next;
}

/**
 * Answers as readable text, keyed by question id, in exactly the shape the
 * previous platform stored in `assessment_submissions.answers_readable`:
 * option labels in the visitor's language, several choices joined with ", ",
 * a typed "other" answer as "Other: <text>", and the contact fields (q5g to
 * q5j) as typed. TAF's Excel export and the sign-in email match both read
 * this column, so the shape must not drift.
 */
export function readableById(
  answers: Answers,
  lang: 'en' | 'bm',
  otherTexts: Record<string, string> = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(answers)) {
    const q = questions[id];
    if (!q || q.type === 'text' || q.type === 'likert' || q.type === 'multi-text') {
      out[id] = Array.isArray(value) ? value.join(', ') : (value ?? '');
      continue;
    }
    const chosen = Array.isArray(value) ? value : [value];
    out[id] = chosen
      .map((optionId) => {
        const opt = q.options?.find((o) => o.id === optionId);
        if (opt?.hasOther && otherTexts[id]) return `Other: ${otherTexts[id]}`;
        return opt?.label[lang] ?? optionId;
      })
      .join(', ');
  }
  /* the sign-in match compares emails in lower case */
  if (out.q5i) out.q5i = out.q5i.trim().toLowerCase();
  return out;
}

/** How far through the branch the visitor is, for the progress ring. */
export function progressOf(history: string[], currentId: string): number {
  const branchLength = history.includes('q2b') || currentId === 'q2b' ? 21 : 24;
  return Math.min(1, (history.length + 1) / branchLength);
}
