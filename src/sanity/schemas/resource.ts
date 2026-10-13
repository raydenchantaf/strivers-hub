import { defineField, defineType } from 'sanity';
import { richText } from './objects';

/**
 * One document type serves Resources, Events and Financing. Which section a
 * piece appears in is decided by its categories, which is how the live
 * dataset already works - editors do not have to learn a new rule.
 */
export const resource = defineType({
  name: 'resource',
  title: 'Article',
  type: 'document',
  groups: [
    { name: 'en', title: 'English', default: true },
    { name: 'bm', title: 'Bahasa Melayu' },
    { name: 'meta', title: 'Settings' },
  ],
  fields: [
    defineField({
      name: 'title_en',
      title: 'Title',
      type: 'string',
      group: 'en',
      validation: (r) => r.required().max(120).warning('Long titles wrap awkwardly on cards.'),
    }),
    defineField({
      name: 'excerpt_en',
      title: 'Summary',
      type: 'text',
      rows: 3,
      group: 'en',
      description: 'One or two sentences. Shown on cards and in search results.',
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: 'image_en',
      title: 'Cover image',
      type: 'image',
      group: 'en',
      options: { hotspot: true },
      description: 'Landscape, at least 1000 x 625. The hotspot decides how it crops.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describes the image for screen readers.',
        }),
      ],
      validation: (r) => r.required(),
    }),
    richText('body_en', 'Body', 'en'),

    defineField({
      name: 'title_bm',
      title: 'Tajuk',
      type: 'string',
      group: 'bm',
      validation: (r) => r.required().max(120),
    }),
    defineField({
      name: 'excerpt_bm',
      title: 'Ringkasan',
      type: 'text',
      rows: 3,
      group: 'bm',
      validation: (r) => r.required().max(300),
    }),
    defineField({
      name: 'image_bm',
      title: 'Imej penutup',
      type: 'image',
      group: 'bm',
      options: { hotspot: true },
      description: 'Optional. Leave empty to reuse the English cover image.',
      fields: [defineField({ name: 'alt', title: 'Teks alt', type: 'string' })],
    }),
    richText('body_bm', 'Kandungan', 'bm'),

    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'meta',
      options: { source: 'title_en', maxLength: 96 },
      description: 'Changing this breaks existing links. Set it once.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categories',
      type: 'array',
      group: 'meta',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      description:
        'The first category is shown on the card. Tagging with Event, Report or ' +
        'Community files the piece under Events; Finance files it under Financing; ' +
        'anything else appears under Resources.',
      validation: (r) => r.required().min(1).max(4),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published on',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Feature at the top of its section',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
      description: 'Only one piece per section is featured; the newest wins ties.',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    { title: 'Title A-Z', name: 'titleAsc', by: [{ field: 'title_en', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title_en',
      subtitle: 'title_bm',
      media: 'image_en',
      date: 'publishedAt',
    },
    prepare: ({ title, subtitle, media, date }) => ({
      title: title || '(untitled)',
      subtitle: [date ? new Date(date).toISOString().slice(0, 10) : null, subtitle]
        .filter(Boolean)
        .join('  ·  '),
      media,
    }),
  },
});
