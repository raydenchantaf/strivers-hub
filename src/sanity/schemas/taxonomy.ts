import { defineField, defineType } from 'sanity';

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title_en',
      title: 'Name (English)',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'title_bm',
      title: 'Nama (Bahasa Melayu)',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'value',
      title: 'Key',
      type: 'slug',
      options: { source: 'title_en', maxLength: 60 },
      description:
        'Used in filter links. Event, Report and Community file an article ' +
        'under Events; Finance files it under Financing.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title_en', subtitle: 'title_bm' },
  },
});

/**
 * The three result bands. Held in the CMS so TAF can rewrite the copy
 * without a deploy; the ranges are deliberately read-only in practice
 * because changing them changes what every past result means.
 */
export const assessmentGrade = defineType({
  name: 'assessmentGrade',
  title: 'Assessment result band',
  type: 'document',
  groups: [
    { name: 'copy', title: 'Copy', default: true },
    { name: 'range', title: 'Score range' },
  ],
  fields: [
    defineField({
      name: 'grade',
      title: 'Tagging key',
      type: 'string',
      group: 'range',
      readOnly: true,
      description:
        'Used to tag a resource with the stage it suits. Set once and left ' +
        'alone - changing it detaches every resource filed under this band.',
    }),
    defineField({
      name: 'key_en',
      title: 'Band name (English)',
      type: 'string',
      group: 'copy',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'key_bm', title: 'Band name (BM)', type: 'string', group: 'copy' }),
    defineField({
      name: 'title_en',
      title: 'Headline (English)',
      type: 'string',
      group: 'copy',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title_bm', title: 'Headline (BM)', type: 'string', group: 'copy' }),
    defineField({
      name: 'desc_en',
      title: 'Description (English)',
      type: 'text',
      rows: 8,
      group: 'copy',
    }),
    defineField({ name: 'desc_bm', title: 'Description (BM)', type: 'text', rows: 8, group: 'copy' }),
    defineField({
      name: 'steps_en',
      title: 'Recommended next steps (English)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'copy',
      validation: (r) => r.max(6),
    }),
    defineField({
      name: 'steps_bm',
      title: 'Langkah seterusnya (BM)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'copy',
      validation: (r) => r.max(6),
    }),
    defineField({
      name: 'min',
      title: 'Lowest score in this band',
      type: 'number',
      group: 'range',
      validation: (r) => r.required().min(0).max(18),
    }),
    defineField({
      name: 'max',
      title: 'Highest score in this band',
      type: 'number',
      group: 'range',
      validation: (r) =>
        r.required().min(0).max(18).custom((value, ctx) => {
          const min = (ctx.document as { min?: number } | undefined)?.min;
          if (typeof value === 'number' && typeof min === 'number' && value < min) {
            return 'Highest score must not be below the lowest.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'color',
      title: 'Accent colour',
      type: 'string',
      group: 'range',
      description: 'Hex value used for the band chip, e.g. #822B62.',
      validation: (r) => r.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }),
    }),
  ],
  orderings: [{ title: 'By score', name: 'minAsc', by: [{ field: 'min', direction: 'asc' }] }],
  preview: {
    select: { title: 'key_en', min: 'min', max: 'max' },
    prepare: ({ title, min, max }) => ({ title, subtitle: `${min}-${max} points` }),
  },
});
