'use client';

import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { EventRow, type EventCard } from '@/components/content/EventRow';

/**
 * Two rails: what is coming, then what has been. The split is the whole point
 * of giving events their own type - on the live platform a 2024 workshop and
 * one taking place next month sit in the same list, in the same order, with
 * nothing to tell them apart.
 */
export function EventsList({ upcoming, past }: { upcoming: EventCard[]; past: EventCard[] }) {
  const { t } = useLang();

  return (
    <section className="band" style={{ paddingTop: 'clamp(40px,4.6vw,64px)' }}>
      <div className="shell">
        {upcoming.length ? (
          <>
            <Reveal className="sec-head" style={{ maxWidth: '52ch' }}>
              <span className="eyebrow">{t('ev.upEyebrow')}</span>
              <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('ev.upH') }} />
            </Reveal>
            {/* one observer for the rail, not one per row */}
            <Reveal className="rail" style={{ marginTop: 'clamp(26px,3vw,40px)' }}>
              {upcoming.map((item) => (
                <EventRow key={item.slug} item={item} />
              ))}
            </Reveal>
          </>
        ) : (
          <Reveal className="ev-none">
            <h2>{t('ev.noneH')}</h2>
            <p>{t('ev.noneP')}</p>
          </Reveal>
        )}

        {past.length ? (
          <>
            <Reveal
              className="sec-head"
              style={{ maxWidth: '52ch', marginTop: 'clamp(56px,6vw,88px)' }}
            >
              <span className="eyebrow">{t('ev.pastEyebrow')}</span>
              <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('ev.pastH') }} />
            </Reveal>
            <Reveal className="rail" style={{ marginTop: 'clamp(26px,3vw,40px)' }}>
              {past.map((item) => (
                <EventRow key={item.slug} item={item} />
              ))}
            </Reveal>
          </>
        ) : null}
      </div>
    </section>
  );
}
