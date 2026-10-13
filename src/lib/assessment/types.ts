import type { Localised } from '../i18n/types';

export type { Localised };

export type SectionKey =
  | 'Business Status'
  | 'Business Info'
  | 'Categorisation'
  | 'Baseline'
  | 'Demographic';

export type QuestionType =
  | 'single'
  | 'multi'
  | 'dropdown'
  | 'likert'
  | 'text'
  | 'multi-text';

export interface Option {
  id: string;
  label: Localised;
  points: number;
  /** Choosing this option routes to a different question than the default. */
  next?: string;
  /** Reveals a free-text box that must be filled before Next enables. */
  hasOther?: boolean;
}

export interface Field {
  id: string;
  label: Localised;
  placeholder?: Localised;
  inputType?: string;
  required?: boolean;
}

export interface Question {
  id: string;
  section: SectionKey;
  type: QuestionType;
  text: Localised;
  /** '[END]' finishes the assessment. */
  next: string;
  options?: Option[];
  fields?: Field[];
  likert?: { low: Localised; high: Localised };
  inputType?: string;
  placeholder?: Localised;
  /** Multi-select ceiling. With exactSelections, also the floor. */
  maxSelections?: number;
  exactSelections?: boolean;
}

export interface Band {
  key: Localised;
  title: Localised;
  desc: Localised;
  steps: { en: string[]; bm: string[] };
  color: string;
  min: number;
  max: number;
}

/** One answer: a single id, a list of ids, or free text. */
export type Answer = string | string[];
export type Answers = Record<string, Answer>;
