/**
 * The Sanity Studio, served from /studio inside this app - the same address
 * the live platform uses today, so editors keep their bookmark and their
 * existing project login.
 */
import { NextStudio } from 'next-sanity/studio';
import config from '../../../../sanity.config';

export const dynamic = 'force-static';
export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
