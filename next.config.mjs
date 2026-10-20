const dev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy: which sources a page may load scripts, styles,
 * images and frames from, and where it may send data.
 *
 * Scripts allow 'unsafe-inline' because Next.js writes small inline scripts
 * into every page to start React. The alternative, a per-request nonce, would
 * make every page render on demand instead of being served pre-built, and the
 * site is built around pre-built pages. What the policy still enforces: no
 * script from any other site except Google's analytics tag, no plugins, no
 * sending data or forms anywhere but this site and Google Analytics, no
 * <base> rewriting, and no framing by other sites (clickjacking).
 *
 * Development adds what `next dev` needs: eval for fast refresh, and the
 * websocket for hot reload.
 */
/* Google's documented list for GA4 with Google signals on. The bare
   analytics.google.com is listed separately because a wildcard does not cover
   it, and that is where GA4 now sends hits; doubleclick and google.com carry
   the signals requests. Missing either, the tag loads but every hit is blocked. */
const GA = [
  'https://www.googletagmanager.com',
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://analytics.google.com',
  'https://*.analytics.google.com',
  'https://*.g.doubleclick.net',
  'https://*.google.com',
  'https://*.google.com.my',
];

const SITE_CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${dev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://cdn.sanity.io ${GA.join(' ')}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${GA.join(' ')}${dev ? ' ws: wss:' : ''}`,
  `frame-src 'self'`,
  `worker-src 'self' blob:`,
  `media-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/* The embedded Sanity Studio is Sanity's own application, talking to its own
   APIs; it gets only the rules that cannot affect it - no framing by other
   sites, no plugins, no <base> rewriting. */
const STUDIO_CSP = [`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 writes AGENTS.md and CLAUDE.md into the repo root on `next dev`.
  // They are instructions for AI coding tools, not part of this project.
  agentRules: false,
  images: {
    // Every editorial image is served by Sanity's CDN; nothing else is remote.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      // the live site shipped these paths; keep them working after the rebuild
      { source: '/penilaian', destination: '/assessment', permanent: true },
      { source: '/sumber', destination: '/resources', permanent: true },
      { source: '/pembiayaan', destination: '/financing', permanent: true },
      { source: '/aktiviti', destination: '/events', permanent: true },
    ];
  },
  async headers() {
    // A preview or staging deployment serves the same pages as the real site.
    // robots.txt asks crawlers not to fetch them; this is what keeps the ones
    // that fetch anyway from indexing what they found. Set SITE_NOINDEX=1
    // everywhere that is not the live site.
    const preview = process.env.SITE_NOINDEX === '1'
      ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      : [];

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          ...preview,
        ],
      },
      // one policy per path: every page but the Studio, and the Studio
      { source: '/((?!studio).*)', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
      { source: '/studio/:path*', headers: [{ key: 'Content-Security-Policy', value: STUDIO_CSP }] },
    ];
  },
};
export default nextConfig;
