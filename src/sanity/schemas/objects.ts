import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Blocks an editor can drop into an article body. These match what the live
 * dataset already contains, so nothing needs migrating.
 */

export const youtube = defineType({
  name: 'youtube',
  title: 'YouTube video',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'Paste the full watch link, e.g. https://www.youtube.com/watch?v=…',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'url' },
    prepare: ({ title }) => ({ title: 'YouTube', subtitle: title }),
  },
});

export const rawHtml = defineType({
  name: 'rawHtml',
  title: 'Table or embed (HTML)',
  type: 'object',
  fields: [
    defineField({
      name: 'code',
      title: 'HTML',
      type: 'text',
      rows: 12,
      description:
        'For comparison tables. Only use HTML you wrote or trust - it is rendered as-is.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { code: 'code' },
    prepare: ({ code }) => ({
      title: 'HTML block',
      subtitle: (code || '').replace(/\s+/g, ' ').slice(0, 60),
    }),
  },
});

export const fileDownload = defineType({
  name: 'fileDownload',
  title: 'File download',
  type: 'object',
  fields: [
    defineField({ name: 'file', title: 'File', type: 'file', validation: (r) => r.required() }),
    defineField({ name: 'title_en', title: 'Label (English)', type: 'string' }),
    defineField({ name: 'title_bm', title: 'Label (Bahasa Melayu)', type: 'string' }),
  ],
  preview: {
    select: { title: 'title_en', subtitle: 'title_bm' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Download', subtitle }),
  },
});

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      options: {
        list: [
          { title: 'Note', value: 'note' },
          { title: 'Tip', value: 'tip' },
          { title: 'Warning', value: 'warn' },
        ],
        layout: 'radio',
      },
      initialValue: 'note',
    }),
    defineField({ name: 'text_en', title: 'Text (English)', type: 'text', rows: 3 }),
    defineField({ name: 'text_bm', title: 'Text (Bahasa Melayu)', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'text_en', tone: 'tone' },
    prepare: ({ title, tone }) => ({ title: `Callout (${tone})`, subtitle: title }),
  },
});

/** The article body type, reused for both languages. */
export function richText(name: string, title: string, group?: string) {
  return defineField({
    name,
    title,
    group,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [
          { title: 'Paragraph', value: 'normal' },
          { title: 'Heading', value: 'h2' },
          { title: 'Sub-heading', value: 'h3' },
          { title: 'Quote', value: 'blockquote' },
        ],
        lists: [
          { title: 'Bulleted', value: 'bullet' },
          { title: 'Numbered', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [
                {
                  name: 'href',
                  type: 'url',
                  title: 'URL',
                  validation: (r: any) =>
                    r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }).required(),
                },
              ],
            },
          ],
        },
      }),
      defineArrayMember({ type: 'image', options: { hotspot: true } }),
      defineArrayMember({ type: 'youtube' }),
      defineArrayMember({ type: 'fileDownload' }),
      defineArrayMember({ type: 'callout' }),
      defineArrayMember({ type: 'rawHtml' }),
    ],
  });
}
