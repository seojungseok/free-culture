'use client';
import type {TicketArticle} from '@/lib/tickets';
import useTicketClock from './useTicketClock';

export default function TicketSectionCopy({article,section,legacy=false}:{article:TicketArticle;section:TicketArticle['sections'][number];legacy?:boolean}) {
  const {day}=useTicketClock(article);
  if(section.validUntil&&section.validUntil<day)return null;
  return <><h2 className={legacy?'text-2xl font-bold leading-snug':undefined}>{section.heading}</h2>{section.paragraphs.map((p,j)=><p key={j} className={legacy?'mt-4 text-base leading-8 text-ink-soft':undefined}>{p}</p>)}</>;
}
