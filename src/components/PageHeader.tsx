'use client';

import { useLang } from './LangProvider';
import { HeaderField } from './HeaderField';

/**
 * The shared inner-page header: colour field, eyebrow, headline with one
 * serif-italic phrase, lede, and an optional count on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
  pad,
}: {
  /** i18n keys */
  eyebrow: string;
  title: string;
  lede?: string;
  children?: React.ReactNode;
  pad?: string;
}) {
  const { t } = useLang();
  return (
    <header className="phead" style={pad ? { paddingBottom: pad } : undefined}>
      <HeaderField />
      <div className="shell">
        <div className="phead-grid">
          <div>
            <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
              {t(eyebrow)}
            </span>
            <h1 className="ld ld-2" dangerouslySetInnerHTML={{ __html: t(title) }} />
            {lede ? <p className="lede ld ld-3">{t(lede)}</p> : null}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
