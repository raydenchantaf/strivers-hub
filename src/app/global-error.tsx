'use client';

/**
 * The last resort: a throw in the root layout itself, which happens before any
 * of the site's chrome or CSS exists. Next replaces the whole document with
 * this, so unlike every other component it has to render its own <html> and
 * <body> - and it cannot rely on globals.css having loaded, which is why the
 * styling here is inline and deliberately plain.
 *
 * If a visitor ever sees this, something is wrong at a level no retry will
 * fix, so it says so in both languages and gets out of the way.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="ms">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#FFF6F1',
          color: '#2A1B24',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <main>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: '#B12069',
            }}
          >
            Strivers&rsquo; Hub
          </p>
          <h1 style={{ fontSize: 26, margin: '12px 0 0', letterSpacing: '-.02em' }}>
            Laman ini tidak dapat dimuatkan
          </h1>
          <p style={{ fontSize: 15, opacity: 0.75, margin: '10px 0 0' }}>
            This site could not be loaded. Please try again shortly.
          </p>
          <p style={{ marginTop: 22 }}>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 22px',
                borderRadius: 999,
                background: '#8C1D4F',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Muat semula / Reload
            </a>
          </p>
          {error.digest ? (
            <p style={{ fontSize: 12, opacity: 0.5, marginTop: 18 }}>
              Rujukan / Reference: <code>{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
