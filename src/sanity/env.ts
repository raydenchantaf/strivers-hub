function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const projectId = required(
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);

export const dataset = required(
  'NEXT_PUBLIC_SANITY_DATASET',
  process.env.NEXT_PUBLIC_SANITY_DATASET,
);

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01';

/**
 * Server-only. Absent at build time on a fresh clone, which is fine - only
 * the write paths need it, and they fail loudly if it is missing.
 */
export const writeToken = process.env.SANITY_API_WRITE_TOKEN;

export const studioPath = '/studio';
