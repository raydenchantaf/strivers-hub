'use client';

import { L as Link } from '@/components/L';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';

/**
 * Lit rather than flat ink: a plain dark band sat directly against the ink
 * footer and the seam vanished. Centred because it carries one message.
 */
export function EventsCta() {
  const { t } = useLang();
  return (
    <section
      className="band band-dark band-lit band-mid"
      style={{ paddingTop: 'clamp(52px,6vw,84px)', paddingBottom: 'clamp(52px,6vw,84px)' }}
    >
      <div className="shell">
        <Reveal className="sec-head" style={{ maxWidth: '52ch', textAlign: 'center' }}>
          <span className="eyebrow">{t('ep.nextEyebrow')}</span>
          <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('ep.nextH') }} />
          <p className="sec-sub">{t('ep.nextP')}</p>
          <Link className="btn btn-light" href="/register" style={{ marginTop: 26 }}>
            <span>{t('ep.nextB')}</span> <span className="arw">&#8594;</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
