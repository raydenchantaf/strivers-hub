import type { SchemaTypeDefinition } from 'sanity';
import { callout, fileDownload, rawHtml, youtube } from './objects';
import { resource } from './resource';
import { event } from './event';
import { assessmentGrade, category } from './taxonomy';
import { legalPage, siteSettings } from './settings';
import { page, pageItem } from './page';

export const schemaTypes: SchemaTypeDefinition[] = [
  // content
  resource,
  event,
  category,
  legalPage,
  siteSettings,
  page,
  assessmentGrade,
  // blocks
  pageItem,
  youtube,
  rawHtml,
  fileDownload,
  callout,
];
