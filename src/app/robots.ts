import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.strivershub.com';

/**
 * Set `SITE_NOINDEX=1` on any deployment that is not the real site - the
 * client preview, a staging box, a review app.
 *
 * Without it the preview serves the same pages as production and a crawler
 * that finds it has two copies of the platform to choose between, which is a
 * problem for the real site rather than for the preview. The header set in
 * `next.config.mjs` is the half that actually keeps it out of an index;
 * this file only stops the polite crawlers fetching in the first place.
 */
const noindex = process.env.SITE_NOINDEX === '1';

export default function robots(): MetadataRoute.Robots {
  if (noindex) {
    /* Named groups as well as the wildcard, because something in front of
       this app may prepend a group of its own. Cloudflare's managed robots.txt
       does exactly that on the preview zone - it inserts `User-agent: *` with
       `Allow: /` above whatever the origin returned, and a crawler merging two
       `*` groups of equal path length resolves the tie towards the allow.
       A crawler that has its own named group ignores `*` entirely, so naming
       the ones that matter puts the decision back here. */
    const crawlers = ['*', 'Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot',
                      'Slurp', 'YandexBot', 'Baiduspider'];
    return { rules: crawlers.map((userAgent) => ({ userAgent, disallow: '/' })) };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // the Studio, the account area, the team's dashboards and the API are not for crawlers
        disallow: ['/studio', '/dashboard', '/admin', '/insights', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
