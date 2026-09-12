'use client';
import type {TicketArticle} from '@/lib/tickets';
import useTicketClock from './useTicketClock';
import styles from './TicketComparison.module.css';

export default function TicketComparison({article}:{article:TicketArticle}) {
  const {day}=useTicketClock(article);
  if(!article.ticketComparison?.length)return null;
  const rows=article.ticketComparison.filter(row=>{
    const end=row.validUntil||article.tickets.find(t=>t.href===row.href)?.validUntil;
    return !end||end>=day;
  });
  const columns=([{key:'entryTime',title:'입장 가능 시간'},{key:'duration',title:'이용시간'},{key:'includes',title:'포함 시설'},{key:'conditions',title:'주요 조건'}] as const).filter(col=>rows.some(row=>row[col.key]?.trim()));
  return <div className={styles.comparison}>
    {!!rows.length&&<div className={styles.scroll} role="region" aria-label="이용권 비교표, 좌우로 스크롤" tabIndex={0}>
      <table><caption>이용권별 입장 시간과 포함 범위</caption><thead><tr><th scope="col">이용권</th>{columns.map(col=><th key={col.key} scope="col">{col.title}</th>)}</tr></thead>
        <tbody>{rows.map((row,i)=><tr key={`${row.label}-${i}`}><th scope="row">{row.label}</th>{columns.map(col=><td key={col.key}>{row[col.key]||'-'}</td>)}</tr>)}</tbody>
      </table>
    </div>}
    {!!rows.length&&<p className={styles.hint}>표는 좌우로 넘겨 볼 수 있어요. 상품별 조건을 비교한 표이며, 시설 전체의 운영시간과는 다를 수 있어요.</p>}
    {rows.length<article.ticketComparison.length&&<p className={styles.hint}>판매기간이 지난 옵션의 조건은 표시하지 않았어요. 아래 링크에서 새로 판매하는 이용권을 볼 수 있어요.</p>}
  </div>;
}
