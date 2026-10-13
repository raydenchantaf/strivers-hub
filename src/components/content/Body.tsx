'use client';

import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react';
import { useLang } from '@/components/LangProvider';
import { urlFor, type SanityImage } from '@/sanity/image';

/**
 * Renders the article body the editors actually wrote: headings, numbered and
 * bulleted lists, bold and italic, links, images, YouTube links, downloads,
 * callouts and the comparison tables they paste as HTML.
 *
 * Embeds are rendered as cards rather than live iframes. A third-party frame
 * inside the reading column is both a privacy disclosure under the PDPA and a
 * layout hazard; a card keeps the rhythm and still gets the reader there.
 */
function components(lang: 'en' | 'bm'): PortableTextComponents {
  return {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      h2: ({ children }) => <h2>{children}</h2>,
      h3: ({ children }) => <h3>{children}</h3>,
      h4: ({ children }) => <h3>{children}</h3>,
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    },
    list: {
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      strong: ({ children }) => <b>{children}</b>,
      em: ({ children }) => <i>{children}</i>,
      link: ({ children, value }) => {
        const href: string = value?.href ?? '#';
        const external = /^https?:/i.test(href);
        return (
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {children}
          </a>
        );
      },
    },
    types: {
      image: ({ value }) => {
        const img = value as SanityImage & {
          dimensions?: { width: number; height: number };
        };
        if (!img?.asset) return null;
        const d = img.dimensions;
        const height = d ? Math.round((900 * d.height) / d.width) : undefined;
        return (
          <figure className="ab-fig">
            <img
              src={urlFor(img, 900)}
              alt={img.alt ?? ''}
              loading="lazy"
              width={900}
              height={height}
            />
          </figure>
        );
      },
      youtube: ({ value }) => {
        const url: string = value?.url ?? '';
        if (!url) return null;
        return (
          <a className="ab-embed" href={url} target="_blank" rel="noopener noreferrer">
            <span className="ab-play" aria-hidden="true" />
            <span>
              <b>{lang === 'bm' ? 'Tonton di YouTube' : 'Watch on YouTube'}</b>
              <span>{url}</span>
            </span>
          </a>
        );
      },
      fileDownload: ({ value }) => {
        const label: string = value?.[`title_${lang}`] || value?.title_en || 'Download';
        const href: string = value?.file?.asset?.url ?? '#';
        return (
          <a className="ab-file" href={href} target="_blank" rel="noopener noreferrer">
            <span className="ab-clip" aria-hidden="true" />
            <span>
              <b>{label}</b>
              <span>PDF</span>
            </span>
          </a>
        );
      },
      callout: ({ value }) => {
        const text: string = value?.[`text_${lang}`] || value?.text_en || '';
        if (!text) return null;
        return <div className={`ab-note ab-note-${value?.tone ?? 'note'}`}>{text}</div>;
      },
      rawHtml: ({ value }) => {
        const code: string = value?.code ?? '';
        if (!code) return null;
        return <div className="ab-table" dangerouslySetInnerHTML={{ __html: code }} />;
      },
    },
  };
}

export function ArticleBody({
  body,
}: {
  body: { en: PortableTextBlock[]; bm: PortableTextBlock[] };
}) {
  const { lang } = useLang();
  const blocks = body[lang]?.length ? body[lang] : body.en;
  return (
    <div className="ab-body">
      <PortableText value={blocks} components={components(lang)} />
    </div>
  );
}
