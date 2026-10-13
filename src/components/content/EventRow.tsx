'use client';

import { L as Link } from '@/components/L';
import { useLang } from '@/components/LangProvider';
import { dateParts } from '@/lib/content-format';

export type EventCard = {
  slug: string;
  title: { en: string; bm: string };
  excerpt: { en: string; bm: string };
  startAt: string | null;
  endAt: string | null;
  mode: 'in-person' | 'online' | 'hybrid';
  venue: string | null;
  city: string | null;
  capacity: number | null;
  img: { card: string; alt: string } | null;
  past: boolean;
};

const MODE_KEY: Record<EventCard['mode'], string> = {
  'in-person': 'ev.inPerson',
  online: 'ev.online',
  hybrid: 'ev.hybrid',
};

/** The time, where there is one. A date-only value - midnight - is a day, not
 *  a time, and printing "12:00 am" beside it would be an invention. */
function timeOf(iso: string, lang: 'en' | 'bm'): string | null {
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return null;
  return d.toLocaleTimeString(lang === 'bm' ? 'ms-MY' : 'en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EventRow({ item }: { item: EventCard }) {
  const { t, p, lang } = useLang();
  const d = item.startAt ? dateParts(item.startAt, lang) : null;
  const time = item.startAt ? timeOf(item.startAt, lang) : null;
  const place = [item.venue, item.city].filter(Boolean).join(', ');

  return (
    <div className={`tlrow${item.past ? ' is-past' : ''}`}>
      <div className="tl-date">
        {d ? (
          <>
            <b>
              {d.day} {d.month}
            </b>
            <span>{d.year}</span>
          </>
        ) : (
          <b>&mdash;</b>
        )}
      </div>
      <div className="tl-node">
        <i />
      </div>
      <Link className="tl-card" href={`/events/${item.slug}`}>
        <div className="tl-body">
          <div className="tags">
            <span className="tag">{t(MODE_KEY[item.mode])}</span>
            {item.past ? <span className="tag tag-past">{t('ev.past')}</span> : null}
          </div>
          <h3>{p(item.title)}</h3>
          <p>{p(item.excerpt)}</p>
          {time || place || item.capacity ? (
            <div className="ev-meta">
              {time ? <span>{time}</span> : null}
              {place ? <span>{place}</span> : null}
              {item.capacity ? (
                <span>
                  {item.capacity} {t('ev.places')}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="tl-img">
          {item.img?.card ? (
            <img src={item.img.card} alt={item.img.alt} loading="lazy" width={720} height={405} />
          ) : null}
        </div>
      </Link>
    </div>
  );
}
