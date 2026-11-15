import type { Metadata } from 'next';
import { SITE } from './site';

export const experienceFeedUrl = new URL('/rss.xml', SITE.url).href;

/** Keep a page's existing search copy, canonical and real photos in every preview. */
export function withSearchMetadata(metadata: Metadata): Metadata {
  const canonical = metadata.alternates?.canonical;
  if (!canonical) return metadata;
  const canonicalUrl = typeof canonical === 'object' && !(canonical instanceof URL)
    ? canonical.url : canonical;
  const url = new URL(String(canonicalUrl), SITE.url).href;
  const openGraph = metadata.openGraph || {};
  const twitter = metadata.twitter || {};
  const images = openGraph.images && (!Array.isArray(openGraph.images) || openGraph.images.length)
    ? openGraph.images
    : [{ url: new URL('/opengraph-image', SITE.url).href, width: 1200, height: 630, alt: SITE.name }];
  const title = typeof metadata.title === 'string' ? { title: metadata.title } : {};
  const description = metadata.description ? { description: metadata.description } : {};
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: { ...metadata.alternates?.types, 'application/rss+xml': experienceFeedUrl },
    },
    openGraph: {
      type: 'website', siteName: SITE.name, locale: 'ko_KR',
      ...title, ...openGraph, ...description, url: openGraph.url || url, images,
    },
    twitter: {
      card: 'summary_large_image', ...title, ...twitter, ...description,
      images: twitter.images || images,
    },
  };
}
