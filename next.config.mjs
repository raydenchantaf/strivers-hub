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

    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ...preview,
      ],
    }];
  },
};
export default nextConfig;
