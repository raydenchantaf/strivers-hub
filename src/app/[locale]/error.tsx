'use client';

import { useEffect } from 'react';

/**
 * What a visitor sees when a page throws.
 *
 * Without this file Next serves its own fallback, which in a production build
 * is an unstyled "Application error: a client-side exception has occurred" on
 * a white page - no nav, no branding, no way back, and nothing that tells the
 * visitor whether the fault was theirs. This is the same 404 treatment: both
 * languages, because an error boundary cannot depend on the language provider
 * it may itself have been rendered instead of.
 *
 * `reset()` re-renders the segment. It is worth offering because a good share
 * of these are transient - a CMS fetch that timed out, a hydration mismatch
 * on a slow connection - and retrying costs the visitor nothing.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* The digest is the only handle on the server-side stack, which Next will
       not send to the browser. Logging it here is what makes a report from a
       visitor ("it said BJ2K9") matchable against the server log. */
    console.error('[render]', error.digest ?? '(no digest)', error.message);
  }, [error]);

  return (
    <div className="shell nf">
      <div>
        <span className="eyebrow" style={{ color: 'var(--magenta)' }}>
          Ralat / Error
        </span>
        <h1>
          Ada yang tidak kena <span className="serif-i">/ Something went wrong</span>
        </h1>
        <p>
          Maaf &mdash; halaman ini gagal dimuatkan. Cuba sekali lagi. &mdash; Sorry, this page
          failed to load. Please try again.
        </p>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-solid" type="button" onClick={reset}>
            <span>Cuba lagi / Try again</span> <span className="arw">&#8594;</span>
          </button>
          <a className="btn btn-ghost" href="/">
            <span>Laman utama / Home</span>
          </a>
        </p>
        {error.digest ? (
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 18 }}>
            Rujukan / Reference: <code>{error.digest}</code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
