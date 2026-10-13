'use client';

import { L as Link } from '@/components/L';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { ArticleBody } from '@/components/content/Body';
import { formatDate } from '@/lib/content-format';
import type { EventDoc } from '@/lib/events';

const MODE_KEY: Record<EventDoc['mode'], string> = {
  'in-person': 'ev.inPerson',
  online: 'ev.online',
  hybrid: 'ev.hybrid',
};

function when(e: EventDoc, lang: 'en' | 'bm'): string {
  if (!e.startAt) return '';
  const locale = lang === 'bm' ? 'ms-MY' : 'en-GB';
  const s = new Date(e.startAt);
  const hasTime = s.getHours() !== 0 || s.getMinutes() !== 0;
  const day = formatDate(e.startAt, lang);
  if (!hasTime) return day;
  const t = (d: Date) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  /* Only print a range when the event ends on the same day - "9:00 am to
     5:00 pm" across two dates says nothing useful. */
  const end = e.endAt ? new Date(e.endAt) : null;
  const sameDay = end && end.toDateString() === s.toDateString();
  return sameDay ? `${day}, ${t(s)}–${t(end)}` : `${day}, ${t(s)}`;
}

export function EventDetail({ event: e }: { event: EventDoc }) {
  const { t, p, lang } = useLang();
  const past = e.startAt ? Date.parse(e.endAt ?? e.startAt) < Date.now() : false;
  const place = [e.venue, e.city].filter(Boolean).join(', ');

  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(28px,3.2vw,44px)' }}>
        <HeaderField />
        <div className="shell">
          <p className="ar-back ld ld-1">
            <Link href="/events">&#8592; {t('ev.back')}</Link>
          </p>
          <div className="tags ld ld-1" style={{ marginTop: 14 }}>
            <span className="tag">{t(MODE_KEY[e.mode])}</span>
            {past ? <span className="tag tag-past">{t('ev.past')}</span> : null}
            {e.categories.slice(0, 2).map((c) => (
              <span className="tag" key={c.en}>
                {p(c)}
              </span>
            ))}
          </div>
          <h1 className="ld ld-2" style={{ maxWidth: '22ch' }}>
            {p(e.title)}
          </h1>
          <p className="lede ld ld-3">{p(e.excerpt)}</p>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="shell">
          <div className="ev-detail">
            <Reveal className="ev-facts" as="dl">
              {e.startAt ? (
                <div>
                  <dt>{t('ev.when')}</dt>
                  <dd>{when(e, lang)}</dd>
                </div>
              ) : null}
              {place ? (
                <div>
                  <dt>{t('ev.where')}</dt>
                  <dd>{place}</dd>
                </div>
              ) : null}
              <div>
                <dt>{t('ev.format')}</dt>
                <dd>{t(MODE_KEY[e.mode])}</dd>
              </div>
              {e.capacity ? (
                <div>
                  <dt>{t('ev.capacity')}</dt>
                  <dd>
                    {e.capacity} {t('ev.places')}
                  </dd>
                </div>
              ) : null}
              {e.registrationUrl && !past ? (
                <a
                  className="btn btn-solid"
                  href={e.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{t('ev.register')}</span> <span className="arw">&#8594;</span>
                </a>
              ) : past ? (
                <p className="ev-closed">{t('ev.closed')}</p>
              ) : null}
            </Reveal>

            <div className="ev-main">
              {e.img?.lead ? (
                <div className="ab-lead">
                  <img
                    src={e.img.lead}
                    alt={e.img.alt}
                    width={e.img.w}
                    height={e.img.h}
                    style={{ marginTop: 0 }}
                  />
                </div>
              ) : null}
              <div style={{ marginTop: e.img?.lead ? 28 : 0 }}>
                <ArticleBody body={e.body} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
