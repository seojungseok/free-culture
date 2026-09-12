'use client';
import type {TicketArticle} from '@/lib/tickets';
import useTicketClock from './useTicketClock';

export default function TicketAddress({article,legacy=false}:{article:TicketArticle;legacy?:boolean}) {
  const {day}=useTicketClock(article);
  const street=article.address.match(/[가-힣\d]+(?:로|길)\s*\d+(?:-\d+)?/)?.[0]||article.address;
  const copy=[article.intro,...article.sections.filter(s=>!s.validUntil||s.validUntil>=day).flatMap(s=>s.paragraphs),...(article.visitInfo||[]).filter(f=>f.status==='confirmed').map(f=>f.value)].join('');
  if(copy.replace(/\s/g,'').includes(street.replace(/\s/g,'')))return null;
  return <p className={legacy?'mt-5 text-sm leading-7 text-ink-soft':undefined}><strong>주소</strong> {article.address}</p>;
}
