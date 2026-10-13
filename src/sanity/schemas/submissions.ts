import { defineField, defineType } from 'sanity';

/**
 * Records written by the site, not by editors. They are read-only in the
 * Studio so nobody edits a respondent's answers by accident; the desk
 * exposes them for review and export.
 */

const readOnly = { readOnly: true as const };

export const assessmentResponse = defineType({
  name: 'assessmentResponse',
  title: 'Assessment response',
  type: 'document',
  ...readOnly,
  fields: [
    defineField({ name: 'submittedAt', title: 'Submitted', type: 'datetime' }),
    defineField({ name: 'language', title: 'Language', type: 'string' }),
    defineField({ name: 'score', title: 'Score', type: 'number' }),
    defineField({ name: 'category', title: 'Band', type: 'string' }),
    defineField({ name: 'firstName', title: 'First name', type: 'string' }),
    defineField({ name: 'lastName', title: 'Last name', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'consent', title: 'Consented', type: 'boolean' }),
    /* Set when the respondent has an account - either because they were
       signed in when they submitted, or because they registered from the
       result screen afterwards. Anonymous responses leave it empty, which is
       the normal case: the assessment never requires an account. The link is
       kept on both documents so the desk can go either way, account to
       result or result to account. */
    defineField({
      name: 'account',
      title: 'Account',
      type: 'reference',
      to: [{ type: 'user' }],
    }),
    defineField({
      name: 'answers',
      title: 'Answers',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', type: 'string', title: 'Question' },
            { name: 'answer', type: 'text', title: 'Answer', rows: 2 },
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        },
      ],
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] },
    { title: 'Highest score', name: 'score', by: [{ field: 'score', direction: 'desc' }] },
  ],
  preview: {
    select: { first: 'firstName', last: 'lastName', score: 'score', band: 'category', at: 'submittedAt', account: 'account' },
    prepare: ({ first, last, score, band, at, account }) => ({
      title: [first, last].filter(Boolean).join(' ') || 'Anonymous',
      subtitle:
        `${band ?? '-'}  ·  ${score ?? '-'}/18  ·  ${at ? String(at).slice(0, 10) : ''}` +
        (account ? '  ·  has an account' : ''),
    }),
  },
});

export const mentorshipInterest = defineType({
  name: 'mentorshipInterest',
  title: 'Mentorship interest',
  type: 'document',
  ...readOnly,
  fields: [
    defineField({ name: 'submittedAt', title: 'Submitted', type: 'datetime' }),
    defineField({ name: 'firstName', title: 'First name', type: 'string' }),
    defineField({ name: 'lastName', title: 'Last name', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'language', title: 'Language', type: 'string' }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { first: 'firstName', last: 'lastName', email: 'email', at: 'submittedAt' },
    prepare: ({ first, last, email, at }) => ({
      title: [first, last].filter(Boolean).join(' ') || email,
      subtitle: `${email ?? ''}  ·  ${at ? String(at).slice(0, 10) : ''}`,
    }),
  },
});

/**
 * Accounts. Passwords are stored only as bcrypt hashes and the field is
 * hidden in the Studio - see docs/HANDOVER.md for the note on moving this
 * to a dedicated auth service if TAF prefers.
 */
export const user = defineType({
  name: 'user',
  title: 'Account',
  type: 'document',
  ...readOnly,
  fields: [
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'firstName', title: 'First name', type: 'string' }),
    defineField({ name: 'lastName', title: 'Last name', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'createdAt', title: 'Created', type: 'datetime' }),
    defineField({ name: 'passwordHash', title: 'Password hash', type: 'string', hidden: true }),
    // Reset tokens are stored hashed, like the password: a leaked dataset
    // must not hand anyone a working reset link.
    defineField({ name: 'resetHash', title: 'Reset token hash', type: 'string', hidden: true }),
    defineField({ name: 'resetExpires', title: 'Reset token expiry', type: 'datetime', hidden: true }),
    defineField({
      name: 'lastResult',
      title: 'Latest assessment',
      type: 'reference',
      to: [{ type: 'assessmentResponse' }],
    }),
  ],
  preview: {
    select: { title: 'email', first: 'firstName', last: 'lastName' },
    prepare: ({ title, first, last }) => ({
      title: [first, last].filter(Boolean).join(' ') || title,
      subtitle: title,
    }),
  },
});
