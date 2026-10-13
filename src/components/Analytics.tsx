'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { device, enabled, pagePath, track } from '@/lib/analytics/client';

/**
 * Site-wide collection for the insights page: page views, time on page, which
 * of a page's key sections were seen, and clicks - every click for the
 * heatmap, plus named events for clicks into guides and onto partner marks.
 * Everything else (the assessment funnel, the game, the helper, the mood
 * check) is sent from the component it happens in.
 *
 * Renders nothing. See lib/analytics/client.ts for what is and is not sent.
 */

const GUIDE = /^\/(en|ms)\/(resources|financing)\/([^/?#]+)/;

export function Analytics() {
  const pathname = usePathname();
  const shownAt = useRef<number>(0);
  const visibleMs = useRef<number>(0);
  const page = useRef<string>('');
  const first = useRef(true);
  const counted = useRef<string | null>(null);

  /* a page view per route, and time on page for the one being left */
  useEffect(() => {
    if (!enabled()) return;
    /* development runs every effect twice; one route is one view */
    if (counted.current === pathname) return;
    counted.current = pathname;
    const leaving = page.current;
    if (leaving) {
      const ms = visibleMs.current + (document.visibilityState === 'visible' ? Date.now() - shownAt.current : 0);
      if (ms > 500) track('dwell', { ms: Math.min(ms, 30 * 60 * 1000) }, leaving);
    }
    page.current = pagePath();
    visibleMs.current = 0;
    shownAt.current = Date.now();

    let ref = '';
    if (first.current) {
      first.current = false;
      try {
        const r = document.referrer ? new URL(document.referrer) : null;
        if (r && r.host !== window.location.host) ref = r.host.replace(/^www\./, '');
      } catch {
        /* unparseable referrer */
      }
    }
    const w = window.innerWidth || document.documentElement.clientWidth;
    track('pv', ref ? { ref, w } : { w });
  }, [pathname]);

  /* time on page only counts while the tab is in front */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        visibleMs.current += Date.now() - shownAt.current;
        if (page.current && visibleMs.current > 500) {
          track('dwell', { ms: Math.min(visibleMs.current, 30 * 60 * 1000) }, page.current);
          visibleMs.current = 0;
        }
      } else {
        shownAt.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* key sections seen, once each per page view */
  useEffect(() => {
    if (!enabled()) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
    if (!els.length) return;
    const done = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.section ?? '';
          if (!id || done.has(id)) continue;
          done.add(id);
          track('sec', { id });
          io.unobserve(e.target);
        }
      },
      { threshold: 0.3 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  /* clicks: a point for the heatmap, and a named event where it matters */
  useEffect(() => {
    if (!enabled()) return;
    const onClick = (e: MouseEvent) => {
      const doc = document.documentElement;
      const x = Math.round((e.pageX / Math.max(1, doc.clientWidth)) * 1000);
      const y = Math.round(e.pageY);
      const target = e.target as Element | null;
      const hit = target?.closest('a,button,[data-track],input,select,label');
      const label = (hit?.getAttribute('data-label') || hit?.getAttribute('aria-label') || hit?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 48);
      track('click', { x, y, h: doc.scrollHeight, vw: window.innerWidth, dv: device(), tag: hit?.tagName.toLowerCase() ?? '', label });

      const a = target?.closest('a') as HTMLAnchorElement | null;
      if (!a) return;
      let path = '';
      try {
        const u = new URL(a.href, window.location.href);
        if (u.host === window.location.host) path = u.pathname;
      } catch {
        /* not a URL */
      }
      const g = path.match(GUIDE);
      if (g) {
        track('guide', { slug: g[3], kind: g[2], cat: a.dataset.cat ?? '', title: (a.dataset.title ?? '').slice(0, 100) });
      } else if (a.dataset.track === 'partner') {
        track('partner', { label: a.dataset.label ?? '' });
      }
    };
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
