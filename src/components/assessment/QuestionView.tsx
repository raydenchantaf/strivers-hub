'use client';

import { useLang } from '@/components/LangProvider';
import type { Answer, Question } from '@/lib/assessment/types';
import { needsOther } from '@/lib/assessment/scoring';

type Props = {
  q: Question;
  value: Answer | undefined;
  otherText: string;
  fieldValues: Record<string, string>;
  onChange: (value: Answer) => void;
  onOther: (text: string) => void;
  onField: (id: string, text: string) => void;
};

/**
 * One question, rendered by type. Every control is a real form control with a
 * label, so the whole assessment works from the keyboard and reads correctly
 * to a screen reader.
 */
export function QuestionView({
  q,
  value,
  otherText,
  fieldValues,
  onChange,
  onOther,
  onField,
}: Props) {
  const { p, t, lang } = useLang();
  const showOther = needsOther(q, value);

  const hint = (() => {
    if (q.type !== 'multi') return null;
    if (q.exactSelections && q.maxSelections)
      return t('as.hint.exact', { n: q.maxSelections });
    if (q.maxSelections) return t('as.hint.upto', { n: q.maxSelections });
    return t('as.hint.multi');
  })();

  return (
    <>
      <h2 className="qtext">{p(q.text)}</h2>
      {hint ? <p className="qhint">{hint}</p> : null}

      {(q.type === 'single' || q.type === 'multi') && q.options ? (
        <div className="opts" role={q.type === 'single' ? 'radiogroup' : 'group'}>
          {q.options.map((o) => {
            const chosen = Array.isArray(value) ? value.includes(o.id) : value === o.id;
            const capped =
              q.type === 'multi' &&
              !chosen &&
              !!q.maxSelections &&
              Array.isArray(value) &&
              value.length >= q.maxSelections;
            return (
              <button
                key={o.id}
                type="button"
                className={`opt${chosen ? ' sel' : ''}`}
                role={q.type === 'single' ? 'radio' : 'checkbox'}
                aria-checked={chosen}
                disabled={capped}
                onClick={() => {
                  if (q.type === 'single') {
                    onChange(o.id);
                    return;
                  }
                  const current = Array.isArray(value) ? [...value] : [];
                  const at = current.indexOf(o.id);
                  if (at > -1) current.splice(at, 1);
                  else if (!q.maxSelections || current.length < q.maxSelections)
                    current.push(o.id);
                  onChange(current);
                }}
              >
                <span className={`mark${q.type === 'multi' ? ' sq' : ''}`} aria-hidden="true" />
                <span className="lab">{p(o.label)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {q.type === 'dropdown' && q.options ? (
        <select
          className="qsel"
          value={typeof value === 'string' ? value : ''}
          aria-label={p(q.text)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{t('as.choose')}</option>
          {q.options.map((o) => (
            <option key={o.id} value={o.id}>
              {p(o.label)}
            </option>
          ))}
        </select>
      ) : null}

      {q.type === 'likert' ? (
        <div className="py-2">
          <div className="likert" role="radiogroup" aria-label={p(q.text)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const chosen = value === String(n);
              return (
                <button
                  key={n}
                  type="button"
                  className={`lk${chosen ? ' sel' : ''}`}
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => onChange(String(n))}
                >
                  <b>{n}</b>
                  <span className="pip" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          {q.likert ? (
            <div className="likert-ends">
              <span>&#8592; {q.likert.low[lang]}</span>
              <span>{q.likert.high[lang]} &#8594;</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {q.type === 'text' ? (
        <div className="py-2">
          <input
            className="num-in"
            type={q.inputType ?? 'text'}
            inputMode={q.inputType === 'number' ? 'numeric' : undefined}
            min={q.inputType === 'number' ? 0 : undefined}
            value={typeof value === 'string' ? value : ''}
            placeholder={q.placeholder ? p(q.placeholder) : ''}
            aria-label={p(q.text)}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : null}

      {q.type === 'multi-text' && q.fields ? (
        <div className="flds">
          {q.fields.map((f) => (
            <div className={`fld${f.inputType === 'email' ? ' wide' : ''}`} key={f.id}>
              <label htmlFor={`fld-${f.id}`}>
                {p(f.label)} {f.required ? <i>*</i> : null}
              </label>
              <input
                id={`fld-${f.id}`}
                type={f.inputType ?? 'text'}
                autoComplete={
                  f.inputType === 'email'
                    ? 'email'
                    : f.inputType === 'tel'
                      ? 'tel'
                      : undefined
                }
                value={fieldValues[f.id] ?? ''}
                placeholder={f.placeholder ? p(f.placeholder) : ''}
                onChange={(e) => onField(f.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}

      {showOther ? (
        <input
          className="other-in"
          type="text"
          value={otherText}
          placeholder={t('as.other')}
          aria-label={t('as.other')}
          onChange={(e) => onOther(e.target.value)}
        />
      ) : null}
    </>
  );
}
