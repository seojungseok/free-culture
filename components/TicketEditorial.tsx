import Link from 'next/link';
import type {TicketArticle} from '@/lib/tickets';
import {SITE} from '@/lib/site';
import {AI_DISCLOSURE,AFFILIATE_DISCLOSURE} from '@/lib/ticket-guarantee.mjs';
import TicketBooking from './TicketBooking';
import styles from './TicketEditorial.module.css';
function Photo({photo,hero=false}:{photo:TicketArticle['thumbnail']|TicketArticle['photos'][number];hero?:boolean}) {
  return <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} loading={hero?'eager':'lazy'} fetchPriority={hero?'high':'auto'} decoding="async"/>
    <figcaption>{photo.kind==='ai-generated'&&<span>{AI_DISCLOSURE} · 실제 시설 촬영 사진이 아닙니다.<br/></span>}{'caption' in photo&&photo.caption&&<span>{photo.caption}<br/></span>}{photo.rightsUrl?<a href={photo.rightsUrl} rel="noopener noreferrer" target="_blank">{photo.credit}</a>:photo.credit}</figcaption>
  </figure>;
}
export default function TicketEditorial({article:a}:{article:TicketArticle}) {
  const jsonLd={'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,image:[a.thumbnail.url],datePublished:a.publishedAt,dateModified:a.checkedAt,mainEntityOfPage:`${SITE.url}/tickets/${a.slug}`,author:{'@type':'Organization',name:SITE.name}};
  return <main className={styles.article} data-ticket-policy={a.contentPolicyVersion}>
    {a.previewScenario&&<p role="status" className={styles.disclosure}>{a.previewScenario}</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>
    <Link href="/tickets">입장권·체험</Link><p className={styles.disclosure}>{AFFILIATE_DISCLOSURE}</p>
    <p>{a.area} · {a.theme}</p><h1>{a.title}</h1><p className={styles.note}>정보 확인 {a.checkedAt.slice(0,10)} · {a.address}</p>
    <Photo photo={a.thumbnail} hero/><p>{a.intro}</p>
    {a.sections.map((s,i)=><section key={i}><h2>{s.heading}</h2>{s.paragraphs.map((p,j)=><p key={j}>{p}</p>)}
      {s.kind==='visit'&&<dl className={styles.facts}>{a.visitInfo?.map(f=><div key={f.topic}><dt>{f.topic}</dt><dd>{f.status==='unknown'&&<span className={styles.note}>미확인 · </span>}{f.value}</dd></div>)}</dl>}
      {s.photoIndex!==undefined&&a.photos[s.photoIndex]&&<Photo photo={a.photos[s.photoIndex]}/>}{s.tickets&&<TicketBooking article={a}/>}
    </section>)}
    <section aria-label="자주 묻는 질문"><h2>자주 묻는 질문</h2>{a.faq?.map(f=><div key={f.question}><h3>{f.question}</h3><p>{f.answer}</p></div>)}</section>
    <nav aria-label="관련 여행 정보"><h2>함께 살펴볼 방문 정보</h2>{a.internalLinks.map(l=><p key={l.href}><Link href={l.href}>{l.label}</Link></p>)}</nav>
    <details><summary>확인한 자료와 출처</summary>{a.sources.map(s=><p key={s.url} className={styles.note}><a href={s.url} target="_blank" rel={s.url.includes('waug.com')?'sponsored noopener noreferrer':'noopener noreferrer'}>{s.label}</a> · {s.checkedAt.slice(0,10)}</p>)}</details>
    <TicketBooking article={a} mobile/>
  </main>;
}
