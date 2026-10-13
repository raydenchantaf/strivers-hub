'use client';

import Image from 'next/image';
import { L as Link } from '@/components/L';
import { useState } from 'react';
import { HeaderField } from '@/components/HeaderField';
import { useLang } from '@/components/LangProvider';
import { Reveal } from '@/components/Reveal';

const BENEFITS = ['b1', 'b2', 'b3'] as const;

export function MentorshipView() {
  const { t } = useLang();
  return (
    <>
      <header className="phead" style={{ paddingBottom: 'clamp(56px,6.5vw,92px)' }}>
        <HeaderField />
        <div className="shell">
          <div className="men-hero">
            <div>
              <span className="eyebrow ld ld-1" style={{ color: 'var(--magenta)' }}>
                {t('mp.eyebrow')}
              </span>
              <h1 className="ld ld-2" dangerouslySetInnerHTML={{ __html: t('mp.h1') }} />
              <p className="lede ld ld-3">{t('mp.lede')}</p>
              <div className="ld ld-4" style={{ marginTop: 30 }}>
                <a className="btn btn-solid" href="#register-interest">
                  <span>{t('mp.cta')}</span> <span className="arw">&#8594;</span>
                </a>
              </div>
            </div>
            <div className="men-frame ld ld-3">
              <Image
                src="/img/mentorship.webp"
                alt={t('mp.imgAlt')}
                width={820}
                height={782}
                priority
              />
            </div>
          </div>
        </div>
      </header>

      <section className="band" style={{ paddingTop: 'clamp(30px,3.6vw,52px)' }}>
        <div className="shell">
          <div className="split" style={{ alignItems: 'start' }}>
            <div>
              <Reveal className="sec-head">
                <span className="eyebrow">{t('mp.benEyebrow')}</span>
                <h2 className="sec-h" dangerouslySetInnerHTML={{ __html: t('mp.benH') }} />
              </Reveal>
              <Reveal className="bens">
                {BENEFITS.map((b, i) => (
                  <div className="ben" key={b}>
                    <span className="bn tnum">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{t(`mp.${b}t`)}</h3>
                      <p>{t(`mp.${b}b`)}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>

            <div id="register-interest">
              <Reveal delay={1}>
                <InterestForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type State = 'idle' | 'sending' | 'done' | 'error';

function InterestForm() {
  const { t, lang } = useLang();
  const [state, setState] = useState<State>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/submit-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, language: lang }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="wpanel">
        <div className="wdone">
          <div className="wt">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          </div>
          <h3>{t('mp.doneH')}</h3>
          <p>{t('mp.doneP')}</p>
          <Link className="btn btn-ghost" href="/assessment" style={{ marginTop: 20 }}>
            <span>{t('mp.doneB')}</span> <span className="arw">&#8594;</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="wpanel" onSubmit={onSubmit} noValidate={false}>
      <span className="eyebrow" style={{ color: 'var(--magenta)' }}>
        {t('mp.formEyebrow')}
      </span>
      <h3>{t('mp.formH')}</h3>
      <p>{t('mp.formP')}</p>

      <div className="wgrid">
        <div className="wf">
          <label htmlFor="mp1">
            <span>{t('mp.f1')}</span> <i>*</i>
          </label>
          <input id="mp1" name="firstName" type="text" autoComplete="given-name" required placeholder="Nurul" />
        </div>
        <div className="wf">
          <label htmlFor="mp2">
            <span>{t('mp.f2')}</span> <i>*</i>
          </label>
          <input id="mp2" name="lastName" type="text" autoComplete="family-name" required placeholder="Rahman" />
        </div>
        <div className="wf wide">
          <label htmlFor="mp3">
            <span>{t('mp.f3')}</span> <i>*</i>
          </label>
          <input id="mp3" name="email" type="email" autoComplete="email" required placeholder="nurul@perniagaan.com" />
        </div>
        <div className="wf wide">
          <label htmlFor="mp4">
            <span>{t('mp.f4')}</span> <i>*</i>
          </label>
          <input id="mp4" name="phone" type="tel" autoComplete="tel" required placeholder="012-345 6789" />
        </div>
      </div>

      <button className="btn btn-solid" type="submit" disabled={state === 'sending'}>
        <span>{state === 'sending' ? t('mp.sending') : t('mp.send')}</span>{' '}
        <span className="arw">&#8594;</span>
      </button>
      <p className="wnote">{state === 'error' ? t('form.error') : t('mp.note')}</p>
    </form>
  );
}
