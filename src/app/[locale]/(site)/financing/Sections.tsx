'use client';

import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';
import { GuideCard } from '@/components/content/Cards';
import type { CardView } from '@/lib/content-format';

/**
 * A ledger, not a card grid. Money information is read as a table: a tabular
 * index figure, hairlines, and the detail flush right so the eye can run down
 * one column. The four routes come from the programme's own guide, which names
 * bank loans, microfinance, government initiatives and non-bank institutions.
 *
 * Each row used to end in a "Ketahui lagi ->" that was a `<span>`: no href, no
 * handler, styled exactly like every real call to action on the site. It read
 * as the one thing on the page you were meant to click and did nothing at all,
 * which is worse than a broken link - a broken link at least moves. The rows
 * are what they always were, four descriptions; when there is somewhere for
 * them to lead, the row becomes a link and the affordance comes back with it.
 */
const ROUTES = ['r1', 'r2', 'r3', 'r4'] as const;

export function FinanceRoutes() {
  const { t } = useLang();
  return (
    <section
      className="band"
      style={{
        paddingTop: 'clamp(40px,4.6vw,64px)',
        paddingBottom: 'clamp(30px,3.4vw,48px)',
      }}
    >
      <div className="shell">
        <Reveal className="sec-head" style={{ maxWidth: 'none' }}>
          <span className="eyebrow">{t('fp.routesEyebrow')}</span>
          <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('fp.routesH') }} />
          <p className="sec-sub">{t('fp.routesSub')}</p>
        </Reveal>

        <Reveal className="ledger">
          {ROUTES.map((r, i) => (
            <div className="lrow" key={r}>
              <span className="ln tnum">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{t(`fp.${r}t`)}</h3>
                <p className="lsub">{t(`fp.${r}s`)}</p>
              </div>
              <p className="ldesc">{t(`fp.${r}d`)}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function FinanceGuides({ items }: { items: CardView[] }) {
  const { t } = useLang();
  if (!items.length) return null;
  return (
    <section className="band band-shell">
      <div className="shell">
        <Reveal className="sec-head" style={{ maxWidth: 'none' }}>
          <span className="eyebrow">{t('fp.guidesEyebrow')}</span>
          <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('fp.guidesH') }} />
        </Reveal>
        <div className="fguides">
          {items.map((item) => (
            <GuideCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
