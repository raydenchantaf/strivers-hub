import 'server-only';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from './env';

/**
 * Read client. Uses the CDN and Next's own data cache; pages tag their
 * fetches so a webhook from Sanity can revalidate exactly what changed.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
});

type FetchOptions = {
  params?: Record<string, unknown>;
  tags?: string[];
  /** Seconds. Defaults to an hour; webhooks handle the urgent cases. */
  revalidate?: number;
};

export async function sanityFetch<T>(query: string, opts: FetchOptions = {}): Promise<T> {
  /* every CMS read also carries `sanity`, so the publish webhook can refresh
     all of them at once (api/revalidate) - the site is small enough that a
     targeted refresh would buy nothing */
  return client.fetch<T>(query, opts.params ?? {}, {
    next: { revalidate: opts.revalidate ?? 3600, tags: [...(opts.tags ?? []), 'sanity'] },
  });
}
