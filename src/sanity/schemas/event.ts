import { defineField, defineType } from 'sanity';
import { richText } from './objects';

/**
 * A dated event, as its own type.
 *
 * Until now Events was a category filter over articles, which is why the live
 * platform cannot tell a workshop held in 2024 from one taking place next
 * month: an article has a publish date and nothing else. Everything that
 * distinguishes an event - when it starts, where it is, whether there is room
 * left, how to register - has nowhere to live on an article.
 *
 * `startAt` is the only field the index truly depends on; it is what sorts
 * upcoming from past, so it is required and everything else is not.
 */
export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  groups: [
    { name: 'when', title: 'When & where', default: true },
    { name: 'en', title: 'English' },
    { name: 'bm', title: 'Bahasa Melayu' },
    { name: 'meta', title: 'Settings' },
  ],
  fields: [
    defineField({
      name: 'startAt',
      title: 'Starts',
      type: 'datetime',
      group: 'when',
      description: 'What sorts this event into upcoming or past.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'endAt',
      title: 'Ends',
      type: 'datetime',
      group: 'when',
      description: 'Leave blank for a single-session event.',
      validation: (r) =>
        r.custom((value, ctx) => {
          const start = (ctx.document as { startAt?: string } | undefined)?.startAt;
          if (value && start && new Date(value) < new Date(start)) {
            return 'An event cannot end before it starts.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'mode',
      title: 'Format',
      type: 'string',
      group: 'when',
      initialValue: 'in-person',
      options: {
        list: [
          { title: 'In person', value: 'in-person' },
          { title: 'Online', value: 'online' },
          { title: 'Hybrid', value: 'hybrid' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      group: 'when',
      description: 'Where it is held, or the platform for an online session.',
    }),
    defineField({
      name: 'city',
      title: 'City or state',
      type: 'string',
      group: 'when',
    }),
    defineField({
      name: 'capacity',
      title: 'Places',
      type: 'number',
      group: 'when',
      description: 'Leave blank when there is no limit.',
      validation: (r) => r.min(1).integer(),
    }),
    defineField({
      name: 'registrationUrl',
      title: 'Registration link',
      type: 'url',
      group: 'when',
      description: 'Where the button sends someone. Leave blank to hide it.',
    }),

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
      validation: (r) => r.required().max(300),
    }),
    richText('body_en', 'Details', 'en'),

    defineField({ name: 'title_bm', title: 'Tajuk', type: 'string', group: 'bm' }),
    defineField({ name: 'excerpt_bm', title: 'Ringkasan', type: 'text', rows: 3, group: 'bm' }),
    richText('body_bm', 'Butiran', 'bm'),

    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      group: 'meta',
      options: { source: 'title_en', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'image',
      title: 'Poster',
      type: 'image',
      group: 'meta',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'category',
      title: 'Tags',
      type: 'array',
      group: 'meta',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'featured',
      title: 'Feature this event',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
    }),
  ],
  orderings: [
    { title: 'Soonest first', name: 'startAsc', by: [{ field: 'startAt', direction: 'asc' }] },
    { title: 'Newest first', name: 'startDesc', by: [{ field: 'startAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title_en', startAt: 'startAt', venue: 'venue', media: 'image' },
    prepare: ({ title, startAt, venue, media }) => ({
      title,
      subtitle: [
        startAt ? new Date(startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date',
        venue,
      ]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
});
