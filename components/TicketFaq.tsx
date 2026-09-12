'use client';
import type {TicketArticle} from '@/lib/tickets';
import useTicketClock from './useTicketClock';

export default function TicketFaq({article,legacy=false}:{article:TicketArticle;legacy?:boolean}) {
  const {day}=useTicketClock(article);
  const questions=article.faq?.filter(f=>!f.validUntil||f.validUntil>=day)||[];
  if(!questions.length)return null;
  return <section className={legacy?'mt-10':undefined} aria-label="자주 묻는 질문"><h2 className={legacy?'text-2xl font-bold':undefined}>자주 묻는 질문</h2>{questions.map(f=><div key={f.question} className={legacy?'mt-6':undefined}><h3 className={legacy?'break-keep text-lg font-bold':undefined}>{f.question}</h3><p className={legacy?'mt-2 text-base leading-8 text-ink-soft':undefined}>{f.answer}</p></div>)}</section>;
}
