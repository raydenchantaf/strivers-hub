import 'server-only';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId, writeToken } from './env';

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

/**
 * Write client. Used only by the API routes that record an assessment
 * submission, a mentorship enquiry or an account. Never import this into a
 * client component - the token must not reach the browser.
 */
export function writeClient() {
  if (!writeToken) {
    throw new Error(
      'SANITY_API_WRITE_TOKEN is not set. Create an Editor token at ' +
        'sanity.io/manage and add it to the environment.',
    );
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: writeToken,
  });
}

type FetchOptions = {
  params?: Record<string, unknown>;
  tags?: string[];
  /** Seconds. Defaults to an hour; webhooks handle the urgent cases. */
  revalidate?: number;
};

export async function sanityFetch<T>(query: string, opts: FetchOptions = {}): Promise<T> {
  return client.fetch<T>(query, opts.params ?? {}, {
    next: { revalidate: opts.revalidate ?? 3600, tags: opts.tags },
  });
}
