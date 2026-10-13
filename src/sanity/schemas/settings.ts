import { defineField, defineType } from 'sanity';

/** Singleton. Everything the chrome needs that TAF may want to change. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'partners', title: 'Partners' },
    { name: 'social', title: 'Social' },
  ],
  fields: [
    defineField({
      name: 'footerBlurb_en',
      title: 'Footer blurb (English)',
      type: 'text',
      rows: 3,
      group: 'general',
    }),
    defineField({
      name: 'footerBlurb_bm',
      title: 'Footer blurb (BM)',
      type: 'text',
      rows: 3,
      group: 'general',
    }),
    defineField({
      name: 'announcement_en',
      title: 'Announcement bar (English)',
      type: 'string',
      group: 'general',
      description: 'Leave empty to hide the bar.',
    }),
    defineField({
      name: 'announcement_bm',
      title: 'Announcement bar (BM)',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'announcementHref',
      title: 'Announcement link',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'partners',
      title: 'Partner logos',
      type: 'array',
      group: 'partners',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Name' },
            { name: 'url', type: 'url', title: 'Website' },
            { name: 'logo', type: 'image', title: 'Logo (colour)' },
            { name: 'logoWhite', type: 'image', title: 'Logo (white, for dark bands)' },
          ],
          preview: { select: { title: 'name', media: 'logo' } },
        },
      ],
    }),
    defineField({
      name: 'social',
      title: 'Social links',
      type: 'array',
      group: 'social',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              type: 'string',
              title: 'Platform',
              options: {
                list: ['Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'TikTok', 'WhatsApp'],
              },
            },
            { name: 'url', type: 'url', title: 'URL' },
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});

/** Privacy policy and any other legal page, bilingual. */
export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  fields: [
    defineField({ name: 'title_en', title: 'Title (English)', type: 'string' }),
    defineField({ name: 'title_bm', title: 'Tajuk (BM)', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: { source: 'title_en' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'updatedAt', title: 'Last updated', type: 'date' }),
    defineField({ name: 'intro_en', title: 'Intro (English)', type: 'text', rows: 3 }),
    defineField({ name: 'intro_bm', title: 'Intro (BM)', type: 'text', rows: 3 }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'heading_en', type: 'string', title: 'Heading (English)' },
            { name: 'heading_bm', type: 'string', title: 'Tajuk (BM)' },
            { name: 'body_en', type: 'array', title: 'Body (English)', of: [{ type: 'block' }] },
            { name: 'body_bm', type: 'array', title: 'Kandungan (BM)', of: [{ type: 'block' }] },
          ],
          preview: { select: { title: 'heading_en', subtitle: 'heading_bm' } },
        },
      ],
    }),
  ],
  preview: { select: { title: 'title_en', subtitle: 'slug.current' } },
});
