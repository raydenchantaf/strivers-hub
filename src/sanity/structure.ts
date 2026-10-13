import type { StructureResolver } from 'sanity/structure';

/**
 * The desk is arranged the way the site is, not the way the schema is.
 * An editor who wants to add a workshop write-up looks under Events, not
 * under a flat list of 25 "resources".
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Strivers’ Hub')
    .items([
      S.listItem()
        .title('Resources')
        .child(
          S.documentList()
            .title('Resources')
            .filter(
              '_type == "resource" && !(count((category[]->value.current)[@ in $sections]) > 0)',
            )
            .params({ sections: ['event', 'report', 'community', 'finance'] })
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
        ),

      S.listItem()
        .title('Events')
        .child(
          S.documentList()
            .title('Events')
            .filter('_type == "resource" && count((category[]->value.current)[@ in $sections]) > 0')
            .params({ sections: ['event', 'report', 'community'] })
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
        ),

      S.listItem()
        .title('Financing')
        .child(
          S.documentList()
            .title('Financing')
            .filter('_type == "resource" && count((category[]->value.current)[@ in $sections]) > 0')
            .params({ sections: ['finance'] })
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
        ),

      S.divider(),

      S.listItem()
        .title('Categories')
        .child(S.documentTypeList('category').title('Categories')),

      S.listItem()
        .title('Assessment bands')
        .child(
          S.documentTypeList('assessmentGrade')
            .title('Assessment bands')
            .defaultOrdering([{ field: 'min', direction: 'asc' }]),
        ),

      S.divider(),

      S.listItem()
        .title('Assessment responses')
        .child(
          S.documentTypeList('assessmentResponse')
            .title('Assessment responses')
            .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
        ),

      S.listItem()
        .title('Mentorship interest')
        .child(
          S.documentTypeList('mentorshipInterest')
            .title('Mentorship interest')
            .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
        ),

      S.listItem().title('Accounts').child(S.documentTypeList('user').title('Accounts')),

      S.divider(),

      S.listItem()
        .title('Legal pages')
        .child(S.documentTypeList('legalPage').title('Legal pages')),

      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
