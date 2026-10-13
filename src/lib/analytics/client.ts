/**
 * First-party analytics, browser side.
 *
 * Events are queued and sent in small batches to /api/track with
 * navigator.sendBeacon, which the browser delivers even as a page unloads.
 * Nothing is stored in a cookie: the only identifier the browser holds is a
 * random per-tab session id in sessionStorage, gone when the tab closes. The
 * server derives a daily visitor count from it without keeping an IP address
 * (see app/api/track/route.ts).
 *
 * Anyone whose browser sends Do Not Track or Global Privacy Control is not
 * counted at all. Where Google Analytics is configured, the headline events
 * are mirrored to it as well, so the same story can be read in either place.
 */

export type EventType =
  | 'pv' // page view
  | 'dwell' // time a page was visible
  | 'sec' // a key section scrolled into view
  | 'click' // a click, for the heatmap
  | 'guide' // a click into a guide
  | 'partner' // a click on a partner's mark
  | 'field' // a word lit in the hive game, or dwelt on in the topics field
  | 'quiz' // a step in the assessment funnel
  | 'hive' // a step in the homepage game
  | 'mood' // the weekly mood check
  | 'mascot' // the helper character
  | 'loader'; // the pre-assessment loading screen

type Queued = { t: EventType; p: string; d?: Record<string, unknown>; ts: number };

const ENDPOINT = '/api/track';
const queue: Queued[] = [];
let timer = 0;
let wired = false;

/* Mirrored to GA4 under these names; heatmap clicks, dwell and section views
   stay first-party only, because they would swamp a GA property for little. */
const GA_NAME: Partial<Record<EventType, (d: Record<string, unknown>) => string>> = {
  guide: () => 'guide_click',
  partner: () => 'partner_click',
  field: (d) => (d.src === 'hive' ? 'field_pick' : 'field_interest'),
  quiz: (d) => `assessment_${d.s}`,
  mood: () => 'mood_check',
  mascot: (d) => `helper_${d.a}`,
  loader: () => 'assessment_loader',
  hive: (d) => `hive_${d.s}`,
};

export function enabled(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return false;
  /* the heatmap on /insights shows pages inside a frame; those are previews,
     not visits */
  if (window.self !== window.top) return false;
  const path = window.location.pathname;
  return !path.startsWith('/insights') && !path.startsWith('/studio');
}

export function sessionId(): string {
  try {
    let s = sessionStorage.getItem('sh_sid');
    if (!s) {
      s = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
      sessionStorage.setItem('sh_sid', s);
    }
    return s;
  } catch {
    return 'nostore';
  }
}

export function device(): 'm' | 'd' {
  return window.innerWidth < 768 ? 'm' : 'd';
}

/** The page's path without the locale prefix: /en/resources -> /resources. */
export function pagePath(): string {
  const p = window.location.pathname.replace(/^\/(en|ms)(?=\/|$)/, '') || '/';
  return p.length > 1 ? p.replace(/\/$/, '') : p;
}

export function lang(): string {
  const m = window.location.pathname.match(/^\/(en|ms)(?=\/|$)/);
  return m ? m[1] : '';
}

function flush() {
  window.clearTimeout(timer);
  timer = 0;
  if (!queue.length) return;
  const batch = queue.splice(0, 40);
  const body = JSON.stringify({ s: sessionId(), l: lang(), v: device(), e: batch });
  const blob = new Blob([body], { type: 'application/json' });
  const sent = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(ENDPOINT, blob);
  if (!sent) {
    fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(
      () => {},
    );
  }
  if (queue.length) flush();
}

function wire() {
  if (wired) return;
  wired = true;
  const out = () => flush();
  window.addEventListener('pagehide', out);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

/** `path` overrides the current page - for time-on-page, filed against the
 *  page being left after the router has already moved on. */
export function track(t: EventType, d?: Record<string, unknown>, path?: string) {
  if (!enabled()) return;
  wire();
  queue.push({ t, p: path ?? pagePath(), d, ts: Date.now() });
  const ga = GA_NAME[t];
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (ga && typeof gtag === 'function') gtag('event', ga(d ?? {}), d ?? {});
  if (queue.length >= 25) flush();
  else if (!timer) timer = window.setTimeout(flush, 4000);
}

/** Send whatever is queued now - before a navigation that leaves the site. */
export function flushNow() {
  if (enabled()) flush();
}
