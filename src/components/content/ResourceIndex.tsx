'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { PageHeader } from '@/components/PageHeader';
import { Reveal } from '@/components/Reveal';
import type { CardView } from '@/lib/content-format';
import { FeatureLead, IndexRow } from './Cards';

/**
 * Header, filter chips and list in one component because the chips sit inside
 * the page header and drive the list below it. Splitting them would mean
 * lifting one boolean into a context for a single page.
 *
 * Only categories carrying more than one article become chips: the dataset has
 * thirty-odd tags and most appear once, so listing them all turns a navigation
 * aid into noise.
 *
 * ---- what a chip does, and why it is more than a filter ----
 *
 * The chips sit at the bottom of a header that fills the viewport, and the
 * list they filter starts below the fold - on a phone, a long way below it.
 * Pressing one changed the page and showed the visitor nothing: the chip went
 * dark, and everything else on screen stayed exactly as it was. The client
 * reported it as the filter not working.
 *
 * Three things answer that, and the scroll is only the first:
 *
 *  - the list is brought into view, under the bar rather than under the
 *    chips, so the first row and the heading above it are both visible;
 *  - the heading at the destination names the category and the count, so
 *    what arrives confirms what was pressed;
 *  - the featured article is dropped while a filter is on. It was never part
 *    of the filtered set - it is `items[0]`, held out before the chips are
 *    even counted - so leaving it up meant "Communication (3)" was headed by
 *    an article about something else, and it added a screenful between the
 *    chips and the answer.
 *
 * The count also goes into a live region, because a visitor who is not
 * watching the screen gets nothing at all from a scroll.
 */
export function ResourceIndex({ items }: { items: CardView[] }) {
  const { p, t, lang } = useLang();
  const [filter, setFilter] = useState('all');
  const listRef = useRef<HTMLElement>(null);

  const lead = items[0];
  const rest = useMemo(() => items.slice(1), [items]);

  const chips = useMemo(() => {
    const freq = new Map<string, { count: number; label: CardView['categories'][number] }>();
    for (const item of rest) {
      for (const c of item.categories) {
        const entry = freq.get(c.en);
        if (entry) entry.count += 1;
        else freq.set(c.en, { count: 1, label: c });
      }
    }
    return [...freq.entries()]
      .filter(([, v]) => v.count > 1)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  }, [rest]);

  const shown = useMemo(
    () =>
      filter === 'all' ? rest : rest.filter((i) => i.categories.some((c) => c.en === filter)),
    [rest, filter],
  );

  const active = useMemo(() => chips.find(([key]) => key === filter)?.[1].label, [chips, filter]);

  /* Only on a press, never on mount: arriving at /resources should leave the
     visitor at the top of the page, reading the headline. */
  const choose = useCallback((next: string) => {
    setFilter(next);
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      /* 78px of sticky bar, and enough over it that the section's own heading
         clears the bar rather than hiding behind it */
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  }, []);

  const filtered = filter !== 'all';

  return (
    <>
      <PageHeader eyebrow="rp.eyebrow" title="rp.h1" lede="rp.lede">
        <div className="chips ld ld-4" role="group" aria-label={t('rp.filterLabel')}>
          <button
            type="button"
            className={`chip${filter === 'all' ? ' on' : ''}`}
            aria-pressed={filter === 'all'}
            onClick={() => choose('all')}
          >
            {t('rp.all')}
            <span className="n">{rest.length}</span>
          </button>
          {chips.map(([key, v]) => (
            <button
              key={key}
              type="button"
              className={`chip${filter === key ? ' on' : ''}`}
              aria-pressed={filter === key}
              onClick={() => choose(key)}
            >
              {p(v.label)}
              <span className="n">{v.count}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {/* The featured article belongs to no category the chips offer, so it
          only makes sense while the list is unfiltered. */}
      {lead && !filtered ? (
        <section
          className="band"
          style={{
            paddingTop: 'clamp(44px,5vw,72px)',
            paddingBottom: 'clamp(30px,3.4vw,48px)',
          }}
        >
          <div className="shell">
            <Reveal>
              <FeatureLead item={lead} />
            </Reveal>
          </div>
        </section>
      ) : null}

      <section
        className="band band-shell"
        style={{ paddingTop: 'clamp(34px,4vw,56px)' }}
        ref={listRef}
      >
        <div className="shell">
          <Reveal className="sec-head" style={{ maxWidth: 'none' }}>
            <span className="eyebrow">{filtered ? p(active!) : t('rp.allEyebrow')}</span>
            <h2
              className="sec-h"
              dangerouslySetInnerHTML={{
                __html: filtered
                  ? t('rp.someH', { n: shown.length })
                  : t('rp.allH'),
              }}
            />
          </Reveal>
          {/* Not watching the screen? The scroll says nothing; this does. */}
          <p className="sr-only" role="status" aria-live="polite">
            {filtered
              ? t('rp.saidFiltered', { n: shown.length, c: p(active!) })
              : t('rp.saidAll', { n: rest.length })}
          </p>
          <div className="idx" key={`${filter}-${lang}`}>
            {shown.length ? (
              shown.map((item) => <IndexRow key={item.id} item={item} />)
            ) : (
              <p className="idx-empty">{t('rp.empty')}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
