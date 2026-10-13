'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId, studioPath } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemas';
import { structure } from './src/sanity/structure';

/**
 * The Studio is served from /studio inside this app, exactly as the live
 * platform does today. Editors keep the same URL and the same login.
 */
export default defineConfig({
  name: 'strivers-hub',
  title: "Strivers' Hub",
  basePath: studioPath,
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    // Vision is a GROQ console. Useful for exports; safe to remove in production.
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    // Records the site writes are never created by hand in the Studio.
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) =>
          !['assessmentResponse', 'mentorshipInterest', 'user'].includes(
            item.templateId as string,
          ),
      ),
  },
});
