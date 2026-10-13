'use client';

import Image from 'next/image';
import { useLayoutEffect, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { track } from '@/lib/analytics/client';

const KEY = 'sh_loader';

/**
 * A short branded moment before the assessment: the Strivers' Hub mark large,
 * the builder's credit small, about a second, once per browser session.
 *
 * It is part of the page rather than added afterwards, so a fresh load paints
 * it first instead of flashing the page and then covering it. A visitor who
 * has already seen it this session has it removed in a layout effect, which
 * runs before the browser paints on a client-side navigation; on a full reload
 * it can show for the moment hydration takes, which reads as the same loader.
 *
 * It is decorative and short, so it is hidden from assistive technology and
 * never takes focus; the assessment underneath is usable the moment it fades.
 */
export function AssessLoader() {
  const { t } = useLang();
  const [state, setState] = useState<'on' | 'out' | 'off'>('on');

  useLayoutEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage blocked: show it, it is harmless */
    }
    if (seen) {
      setState('off');
      return;
    }
    track('loader');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fade = window.setTimeout(() => setState('out'), reduce ? 600 : 1150);
    const done = window.setTimeout(() => setState('off'), reduce ? 650 : 1650);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, []);

  if (state === 'off') return null;
  return (
    <div className={`as-loader${state === 'out' ? ' out' : ''}`} aria-hidden="true">
      <div className="asl-in">
        <Image className="asl-logo" src="/img/logo.webp" alt="" width={440} height={131} priority />
        <svg className="asl-hex" viewBox="0 0 100 112" width="46" height="52">
          <defs>
            <linearGradient id="asl-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#822B62" />
              <stop offset=".55" stopColor="#B12069" />
              <stop offset="1" stopColor="#FF7000" />
            </linearGradient>
          </defs>
          <polygon className="asl-track" points="50,6 92,30 92,82 50,106 8,82 8,30" />
          <polygon className="asl-draw" points="50,6 92,30 92,82 50,106 8,82 8,30" />
        </svg>
        <p className="asl-t">{t('as.loading')}</p>
      </div>
      <div className="asl-by">
        <span>{t('nav.by')}</span>
        <Image src="/img/unbound.webp" alt="" width={480} height={117} />
      </div>
    </div>
  );
}
