'use client';

import { L as Link } from '@/components/L';
import { useLang } from '@/components/LangProvider';
import { dateParts, formatDate, type CardView } from '@/lib/content-format';

/* The editorial index row used on Resources. Rules and generous leading
   rather than a wall of identical cards: the title is the object you scan. */
export function IndexRow({ item }: { item: CardView }) {
  const { p, lang } = useLang();
  return (
    <Link className="ix" href={item.href}>
      <div className="ix-img">
        {item.img.thumb ? (
          <img src={item.img.thumb} alt={item.img.alt} loading="lazy" width={320} height={200} />
        ) : null}
      </div>
      <div>
        <div className="ix-meta">
          <span className="ix-cat">{p(item.categories[0])}</span>
          <span className="ix-dot" />
          <span className="ix-date">{formatDate(item.publishedAt, lang)}</span>
        </div>
        <h3 className="ix-t">{p(item.title)}</h3>
        <p className="ix-x">{p(item.excerpt)}</p>
      </div>
    </Link>
  );
}

/** The featured piece at the top of a section. */
export function FeatureLead({ item }: { item: CardView }) {
  const { p, t, lang } = useLang();
  return (
    <Link className="lead" href={item.href}>
      <div className="lead-art">
        <div className="lead-frame">
          {item.img.lead ? (
            <img
              src={item.img.lead}
              alt={item.img.alt}
              width={1440}
              height={810}
              fetchPriority="high"
            />
          ) : null}
        </div>
      </div>
      <div>
        <div className="lead-meta">
          <span className="lead-pick">{t('rp.featured')}</span>
          <span className="ix-dot" />
          <span className="eyebrow" style={{ color: 'var(--orange-ink)', margin: 0 }}>
            {p(item.categories[0])}
          </span>
          <span className="ix-dot" />
          <span className="ix-date tnum">{formatDate(item.publishedAt, lang)}</span>
        </div>
        <h2>{p(item.title)}</h2>
        <p>{p(item.excerpt)}</p>
        <span className="more">
          {t('rp.read')} <span className="arw">&#8594;</span>
        </span>
      </div>
    </Link>
  );
}

/**
 * The card shows a second category only when the pair fits on one line.
 * Real category names run to twenty characters or more, and two of them wrap
 * to a second row, which pushes the title down and makes a row of cards look
 * misaligned even when they are the same height.
 */
const TAG_ROW_BUDGET = 26;

function tagsFor(categories: CardView['categories'], pick: (c: CardView['categories'][number]) => string) {
  const first = categories[0];
  if (!first) return [];
  const second = categories[1];
  if (!second) return [first];
  return pick(first).length + pick(second).length <= TAG_ROW_BUDGET
    ? [first, second]
    : [first];
}

/** The square card used for related reading and the homepage preview. */
export function ArticleTile({ item }: { item: CardView }) {
  const { p, t } = useLang();
  const tags = tagsFor(item.categories, p);
  return (
    <Link className="card" href={item.href}>
      <div className="card-img">
        {item.img.card ? (
          <img src={item.img.card} alt={item.img.alt} loading="lazy" width={720} height={405} />
        ) : null}
      </div>
      <div className="card-body">
        <div className="tags">
          {tags.map((c, i) => (
            <span key={c.en} className={`tag${i === 1 ? ' j' : ''}`}>
              {p(c)}
            </span>
          ))}
        </div>
        <h3>{p(item.title)}</h3>
        <p>{p(item.excerpt)}</p>
        <div className="more">
          {t('rp.read')} <span className="arw">&#8594;</span>
        </div>
      </div>
    </Link>
  );
}

/** The larger card used for the two financing guides. */
export function GuideCard({ item }: { item: CardView }) {
  const { p, t } = useLang();
  return (
    <Link className="fg" href={item.href}>
      <div className="fg-img">
        {item.img.card ? (
          <img src={item.img.card} alt={item.img.alt} loading="lazy" width={720} height={405} />
        ) : null}
      </div>
      <div className="fg-body">
        <div className="tags">
          <span className="tag">{p(item.categories[0])}</span>
        </div>
        <h3>{p(item.title)}</h3>
        <p>{p(item.excerpt)}</p>
        <span className="more">
          {t('rp.read')} <span className="arw">&#8594;</span>
        </span>
      </div>
    </Link>
  );
}

/** One stop on the events rail. Chronology is the structure, so it is the layout. */
export function TimelineRow({ item }: { item: CardView }) {
  const { p, lang } = useLang();
  const d = dateParts(item.publishedAt, lang);
  return (
    <div className="tlrow">
      <div className="tl-date">
        <b>
          {d.day} {d.month}
        </b>
        <span>{d.year}</span>
      </div>
      <div className="tl-node">
        <i />
      </div>
      <Link className="tl-card" href={item.href}>
        <div className="tl-body">
          <div className="tags">
            <span className="tag">{p(item.categories[0])}</span>
          </div>
          <h3>{p(item.title)}</h3>
          <p>{p(item.excerpt)}</p>
        </div>
        <div className="tl-img">
          {item.img.card ? (
            <img src={item.img.card} alt={item.img.alt} loading="lazy" width={720} height={405} />
          ) : null}
        </div>
      </Link>
    </div>
  );
}
