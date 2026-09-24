import data from '@/data/ticket-guides.json';

export type TicketArticle = {
  slug: string; placeId: string; placeName: string; title: string; description: string;
  intro: string; area: string; address: string; theme: string;
  thumbnail: {url: string; alt: string; credit: string; width: number; height: number; rightsUrl?: string};
  photos: {url: string; alt: string; credit: string; caption?: string; width: number; height: number; rightsUrl?: string}[];
  sections: {heading: string; paragraphs: string[]}[];
  visitInfo: {topic: string; value: string; checkedAt: string; sourceUrls: string[]}[];
  faq: {question: string; answer: string}[];
  internalLinks: {href: string; label: string}[];
  sources: {url: string; label: string; checkedAt: string}[];
  publishedAt: string; checkedAt: string; indexable: boolean;
  location?: {lat: number; lng: number; status: string; label: string; area: string};
};

export function getTickets(): TicketArticle[] {
  return (data.articles as TicketArticle[]).filter((article) => Date.parse(article.publishedAt) <= Date.now());
}

export function getTicket(slug: string): TicketArticle | undefined {
  return getTickets().find((article) => article.slug === slug);
}
