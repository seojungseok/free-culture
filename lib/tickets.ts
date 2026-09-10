import data from '@/data/waug/published.json';
import listingData from '@/data/waug/listings.json';
import fs from 'node:fs';
import path from 'node:path';

export type TicketArticle = {
  listTitle?:string;
  location?:{lat:number;lng:number;address?:string;label?:string;area?:string;status:string;sourceUrl:string;checkedAt:string}|null;
  slug:string;placeId:string;placeName:string;title:string;description:string;intro:string;area:string;address:string;theme:string;
  thumbnail:{url:string;alt:string;credit:string;width:number;height:number};
  photos:{url:string;alt:string;credit:string;caption?:string;rightsUrl?:string;width?:number;height?:number}[];
  sections:{heading:string;paragraphs:string[];photoIndex?:number;tickets?:boolean}[];
  internalLinks:{href:string;label:string}[];
  sources:{url:string;label:string;checkedAt:string}[];
  publishedAt:string;checkedAt:string;
  tickets:{verifiedBenefit?:{sourceUrl:string;conditions:string;checkedAt:string;startsAt:string;endsAt:string}|null;label:string;href:string;validUntil:string|null}[];
};
// Private research, future schedules and affiliate candidates never enter a browser bundle.
export function getTickets():TicketArticle[] {
  const listings=listingData.entries as Record<string,Pick<TicketArticle,'listTitle'|'location'>>;
  const enrich=(articles:TicketArticle[])=>articles.map(a=>({...a,...listings[a.slug]}));
  // Local-only editorial preview. Production never reads this file or bypasses the published projection.
  if (process.env.NODE_ENV === 'development' && process.env.WAUG_PREVIEW === '1') {
    const file=path.join(process.cwd(),'.cache','waug','preview.json');
    if(fs.existsSync(file))return enrich(JSON.parse(fs.readFileSync(file,'utf8')).articles as TicketArticle[]);
  }
  return enrich((data.articles as TicketArticle[]).filter(a=>Date.parse(a.publishedAt)<=Date.now()));
}
export function getTicket(slug:string){return getTickets().find(a=>a.slug===slug);}
