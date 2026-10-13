'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { readOutcome } from '@/lib/assessment/outcome';
import { track } from '@/lib/analytics/client';

/**
 * The helper: a small hexagon character in the bottom corner that invites a
 * visitor to take the assessment, and once a week asks how business is going.
 *
 * It is drawn from the Strivers' Hub mark - the same pointy-top hexagon, the
 * same plum-to-orange ribbon, a face in the void - so it reads as part of the
 * platform rather than a chat widget bolted on.
 *
 * Manners, because a character in the corner is easy to get wrong:
 *  - it waits until the visitor has scrolled or spent a few seconds on a page;
 *  - the speech bubble opens by itself once per session at most, and after
 *    that the character just waits to be tapped;
 *  - "Not now" puts it away for a week, on this device;
 *  - it stays off the pages where the visitor is already doing the thing it
 *    would ask for, or filling in a form: the assessment, results and the
 *    account pages - and it steps aside while the homepage game is on screen,
 *    which needs the bottom of a phone for its tray;
 *  - Escape closes the bubble, and nothing in it moves for anyone who has
 *    asked for reduced motion.
 */

const QUIET = /^\/(en|ms)\/(assessment|results|login|register|forgot-password|reset-password|profile|dashboard)(\/|$)/;
const HIDE_KEY = 'sh_helper_hide';
const OPENED_KEY = 'sh_helper_opened';
const MOOD_KEY = 'sh_mood_week';
const WEEK_MS = 7 * 24 * 3600 * 1000;

/** ISO week, e.g. 2026-W41, so the mood check is asked once a week. */
function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the helper simply asks again next time */
  }
}

export function HexFriend({ size = 64, waving = false }: { size?: number; waving?: boolean }) {
  return (
    <svg className={`hf${waving ? ' wave' : ''}`} width={size} height={size * 1.12} viewBox="0 0 100 112" aria-hidden="true">
      <defs>
        <linearGradient id="hf-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#822B62" />
          <stop offset=".5" stopColor="#B12069" />
          <stop offset="1" stopColor="#FF7000" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="107" rx="23" ry="3.6" fill="rgba(26,11,21,.13)" />
      <g className="hf-body">
        <path className="hf-arm" d="M86 54 Q98 46 96 34" fill="none" stroke="#FF7000" strokeWidth="7" strokeLinecap="round" />
        <polygon points="50,7 89,29 89,75 50,97 11,75 11,29" fill="url(#hf-g)" stroke="url(#hf-g)" strokeWidth="9" strokeLinejoin="round" />
        <polygon points="50,24 72,36.5 72,62.5 50,75 28,62.5 28,36.5" fill="#FFF6F1" stroke="#FFF6F1" strokeWidth="5" strokeLinejoin="round" />
        <g className="hf-eyes">
          <ellipse cx="41.5" cy="47" rx="3.6" ry="4.6" fill="#1A0B15" />
          <ellipse cx="58.5" cy="47" rx="3.6" ry="4.6" fill="#1A0B15" />
          <circle cx="42.8" cy="45.3" r="1.25" fill="#fff" />
          <circle cx="59.8" cy="45.3" r="1.25" fill="#fff" />
        </g>
        <ellipse cx="35" cy="56" rx="4.2" ry="2.5" fill="#FF7000" opacity=".32" />
        <ellipse cx="65" cy="56" rx="4.2" ry="2.5" fill="#FF7000" opacity=".32" />
        <path d="M44.5 56.5 Q50 61.5 55.5 56.5" fill="none" stroke="#1A0B15" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const MOODS = [
  { v: 1, key: 'hp.m1', face: 'M44 60 Q50 55 56 60' },
  { v: 2, key: 'hp.m2', face: 'M44 58 L56 58' },
  { v: 3, key: 'hp.m3', face: 'M44 56 Q50 62 56 56' },
] as const;

function MoodFace({ d, v }: { d: string; v: number }) {
  const fill = v === 1 ? '#F4D9C4' : v === 2 ? '#F6E6CF' : '#F7D6E3';
  return (
    <svg viewBox="30 36 40 34" width="26" height="22" aria-hidden="true">
      <circle cx="50" cy="53" r="15" fill={fill} />
      <circle cx="44.5" cy="49" r="2" fill="#1A0B15" />
      <circle cx="55.5" cy="49" r="2" fill="#1A0B15" />
      <path d={d} fill="none" stroke="#1A0B15" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Helper() {
  const { t, locale } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const quiet = QUIET.test(pathname);

  const [ready, setReady] = useState(false); // the visitor has scrolled or lingered
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(true); // until storage says otherwise
  const [aside, setAside] = useState(false); // the homepage game is on screen
  const [mood, setMood] = useState<number | null>(null);
  const [askMood, setAskMood] = useState(false);
  const [returning, setReturning] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    const hiddenUntil = Number(read(HIDE_KEY) || 0);
    setGone(hiddenUntil > Date.now());
    setAskMood(read(MOOD_KEY) !== isoWeek());
    setReturning(Boolean(readOutcome()));
  }, [pathname]);

  /* appear after a little scrolling or a few seconds, whichever comes first */
  useEffect(() => {
    setReady(false);
    if (quiet) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.45) go();
    };
    const timer = window.setTimeout(go, 7000);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname, quiet]);

  /* the first time it appears in a session, the bubble opens by itself */
  useEffect(() => {
    if (!ready || gone || quiet || shown.current) return;
    shown.current = true;
    track('mascot', { a: 'show' });
    let first = false;
    try {
      first = sessionStorage.getItem(OPENED_KEY) !== '1';
      sessionStorage.setItem(OPENED_KEY, '1');
    } catch {
      first = false;
    }
    if (first) {
      const id = window.setTimeout(() => setOpen(true), 650);
      return () => window.clearTimeout(id);
    }
  }, [ready, gone, quiet]);

  /* step aside while the homepage game is on screen */
  useEffect(() => {
    const game = document.getElementById('hive');
    if (!game) {
      setAside(false);
      return;
    }
    const io = new IntersectionObserver(([e]) => setAside(e.isIntersecting), { threshold: 0.08 });
    io.observe(game);
    return () => io.disconnect();
  }, [pathname]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (quiet || gone) return null;
  /* not inside the heatmap's page previews on /insights */
  if (typeof window !== 'undefined' && window.self !== window.top) return null;

  const visible = ready && !aside;
  const go = () => {
    track('mascot', { a: 'cta' });
    setOpen(false);
    router.push(`/${locale}${returning ? '/results' : '/assessment'}`);
  };
  const notNow = () => {
    track('mascot', { a: 'dismiss' });
    write(HIDE_KEY, String(Date.now() + WEEK_MS));
    setOpen(false);
    setGone(true);
  };
  const answer = (v: number) => {
    setMood(v);
    write(MOOD_KEY, isoWeek());
    track('mood', { v, w: isoWeek() });
  };

  return (
    <div className={`hp${visible ? ' on' : ''}${open ? ' open' : ''}`}>
      {open ? (
        <div className="hp-bubble" ref={bubbleRef} role="dialog" aria-labelledby="hp-h">
          <button className="hp-x" type="button" onClick={close} aria-label={t('hp.close')}>
            &times;
          </button>
          <p className="hp-h" id="hp-h">
            {returning ? t('hp.backH') : t('hp.h')}
          </p>
          <p className="hp-p">{returning ? t('hp.backP') : t('hp.p')}</p>
          <button className="btn btn-solid btn-sm hp-go" type="button" onClick={go}>
            <span>{returning ? t('hp.backCta') : t('hp.cta')}</span> <span className="arw">&#8594;</span>
          </button>

          {askMood || mood ? (
            <div className="hp-mood">
              {mood ? (
                <p className="hp-thanks" role="status">
                  {t('hp.thanks')}
                </p>
              ) : (
                <>
                  <p className="hp-q" id="hp-q">
                    {t('hp.moodQ')}
                  </p>
                  <div className="hp-faces" role="group" aria-labelledby="hp-q">
                    {MOODS.map((m) => (
                      <button key={m.v} type="button" className="hp-face" onClick={() => answer(m.v)}>
                        <MoodFace d={m.face} v={m.v} />
                        <span>{t(m.key)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}

          <button className="hp-later" type="button" onClick={notNow}>
            {t('hp.later')}
          </button>
        </div>
      ) : null}

      <button
        className="hp-me"
        type="button"
        aria-label={t('hp.open')}
        aria-expanded={open}
        tabIndex={visible ? 0 : -1}
        onClick={() => {
          if (!open) track('mascot', { a: 'open' });
          setOpen((v) => !v);
        }}
      >
        <HexFriend waving={open} />
      </button>
    </div>
  );
}
