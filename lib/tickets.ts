import data from '@/data/waug/published.json';
import fs from 'node:fs';
import path from 'node:path';

export type TicketArticle = {
  slug:string;placeId:string;title:string;description:string;intro:string;area:string;address:string;theme:string;
  thumbnail:{url:string;alt:string;credit:string;width:number;height:number};
  photos:{url:string;alt:string;credit:string}[];
  sections:{heading:string;paragraphs:string[];photoIndex?:number;tickets?:boolean}[];
  internalLinks:{href:string;label:string}[];
  sources:{url:string;label:string;checkedAt:string}[];
  publishedAt:string;checkedAt:string;
  tickets:{label:string;href:string;validUntil:string|null}[];
};
// Private research, future schedules and affiliate candidates never enter a browser bundle.
export function getTickets():TicketArticle[] {
  // Local-only editorial preview. Production never reads this file or bypasses the published projection.
  if (process.env.NODE_ENV === 'development' && process.env.WAUG_PREVIEW === '1') {
    const file=path.join(process.cwd(),'.cache','waug','preview.json');
    if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file,'utf8')).articles as TicketArticle[];
  }
  return (data.articles as TicketArticle[]).filter(a=>Date.parse(a.publishedAt)<=Date.now());
}
export function getTicket(slug:string){return getTickets().find(a=>a.slug===slug);}
