import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * An editable page.
 *
 * Deliberately a set of named sections rather than a free block builder. The
 * About page has a designed shape - a hero, three reasons, a pulled quote,
 * three roles - and a generic builder would let an editor produce a page the
 * stylesheet has no answer for. Every string on the page is editable; the
 * arrangement is not.
 *
 * Headings are split into a lead and an accent because the accent is set in
 * serif italic. Asking an editor to type `<span class="serif-i">` would be
 * asking them to write markup, and would put unescaped HTML from the CMS on
 * the page. Two plain fields, composed in code.
 */

const pair = (name: string, title: string, rows?: number) => [
  defineField({
    name: `${name}_en`,
    title: `${title} (English)`,
    type: rows ? 'text' : 'string',
    ...(rows ? { rows } : {}),
  }),
  defineField({
    name: `${name}_bm`,
    title: `${title} (Bahasa Melayu)`,
    type: rows ? 'text' : 'string',
    ...(rows ? { rows } : {}),
  }),
];

export const pageItem = defineType({
  name: 'pageItem',
  title: 'Item',
  type: 'object',
  fields: [...pair('title', 'Heading'), ...pair('body', 'Text', 4)],
  preview: {
    select: { title: 'title_en', subtitle: 'body_en' },
  },
});

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Top of the page', default: true },
    { name: 'why', title: 'Why this platform exists' },
    { name: 'quote', title: 'Pulled quote' },
    { name: 'roles', title: 'The roles we hold' },
  ],
  fields: [
    defineField({
      name: 'slug',
      title: 'Which page',
      type: 'slug',
      description: 'Use "about" for the About page. Changing this detaches it from its route.',
      validation: (r) => r.required(),
      group: 'hero',
    }),

    ...pair('eyebrow', 'Eyebrow').map((f) => ({ ...f, group: 'hero' })),
    ...pair('headingLead', 'Heading, plain part').map((f) => ({ ...f, group: 'hero' })),
    ...pair('headingAccent', 'Heading, italic part').map((f) => ({ ...f, group: 'hero' })),
    ...pair('lede', 'Opening paragraph', 4).map((f) => ({ ...f, group: 'hero' })),
    ...pair('ctaLabel', 'Button label').map((f) => ({ ...f, group: 'hero' })),
    defineField({
      name: 'image',
      title: 'Portrait',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),

    ...pair('whyEyebrow', 'Eyebrow').map((f) => ({ ...f, group: 'why' })),
    ...pair('whyHeadingLead', 'Heading, plain part').map((f) => ({ ...f, group: 'why' })),
    ...pair('whyHeadingAccent', 'Heading, italic part').map((f) => ({ ...f, group: 'why' })),
    defineField({
      name: 'why',
      title: 'Reasons',
      type: 'array',
      of: [defineArrayMember({ type: 'pageItem' })],
      group: 'why',
      description: 'Three reads best - the row is built for three.',
      validation: (r) => r.max(4),
    }),

    ...pair('quote', 'Quote', 3).map((f) => ({ ...f, group: 'quote' })),
    ...pair('quoteSub', 'Below the quote', 4).map((f) => ({ ...f, group: 'quote' })),

    ...pair('rolesEyebrow', 'Eyebrow').map((f) => ({ ...f, group: 'roles' })),
    ...pair('rolesHeadingLead', 'Heading, plain part').map((f) => ({ ...f, group: 'roles' })),
    ...pair('rolesHeadingAccent', 'Heading, italic part').map((f) => ({ ...f, group: 'roles' })),
    defineField({
      name: 'roles',
      title: 'Roles',
      type: 'array',
      of: [defineArrayMember({ type: 'pageItem' })],
      group: 'roles',
      description: 'Three reads best - the row is built for three.',
      validation: (r) => r.max(4),
    }),
  ],
  preview: {
    select: { title: 'headingLead_en', subtitle: 'slug.current' },
    prepare: ({ title, subtitle }) => ({ title: title || subtitle || 'Page', subtitle: `/${subtitle ?? ''}` }),
  },
});
