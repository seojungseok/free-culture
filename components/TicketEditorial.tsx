import Link from 'next/link';
import type {TicketArticle} from '@/lib/tickets';
import {SITE} from '@/lib/site';
import {AI_DISCLOSURE,AFFILIATE_DISCLOSURE} from '@/lib/ticket-guarantee.mjs';
import TicketBooking from './TicketBooking';
import TicketSectionCopy from './TicketSectionCopy';
import TicketFaq from './TicketFaq';
import TicketAddress from './TicketAddress';
import TicketNearby from './TicketNearby';
import styles from './TicketEditorial.module.css';
function Photo({photo,hero=false}:{photo:TicketArticle['thumbnail']|TicketArticle['photos'][number];hero?:boolean}) {
  const src=photo.url.startsWith(`${SITE.url}/ticket-images/`)?photo.url.slice(SITE.url.length):photo.url;
  return <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={photo.alt} width={photo.width} height={photo.height} loading={hero?'eager':'lazy'} fetchPriority={hero?'high':'auto'} decoding="async"/>
    <figcaption>{photo.kind==='ai-generated'?<span>{AI_DISCLOSURE} · 실제 시설·전시 또는 체험 결과물을 촬영한 사진이 아닙니다.</span>:<>{'caption' in photo&&photo.caption&&<span>{photo.caption}<br/></span>}{photo.rightsUrl?<a href={photo.rightsUrl} rel="noopener noreferrer" target="_blank">{photo.credit}</a>:photo.credit}</>}</figcaption>
  </figure>;
}
export default function TicketEditorial({article:a}:{article:TicketArticle}) {
  const jsonLd={'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,image:[a.thumbnail.url],datePublished:a.publishedAt,dateModified:a.checkedAt,mainEntityOfPage:`${SITE.url}/tickets/${a.slug}`,author:{'@type':'Organization',name:SITE.name}};
  return <main className={styles.article} data-ticket-policy={a.contentPolicyVersion}>
    {a.previewScenario&&<p role="status" className={styles.disclosure}>{a.previewScenario}</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>
    <Link href="/tickets">입장권·체험</Link><p className={styles.disclosure}>{AFFILIATE_DISCLOSURE}</p>
    <p>{a.area} · {a.theme}</p><h1>{a.title}</h1><p className={styles.note}>정보 확인 {new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date(a.checkedAt))}</p>
    <Photo photo={a.thumbnail} hero/><p>{a.intro}</p><TicketAddress article={a}/>
    {a.sections.map((s,i)=><section key={i}><TicketSectionCopy article={a} section={s}/>
      {s.kind==='visit'&&<dl className={styles.facts}>{a.visitInfo?.filter(f=>f.status==='confirmed').map(f=><div key={f.topic}><dt>{f.topic}</dt><dd>{f.value}</dd></div>)}</dl>}
      {s.photoIndex!==undefined&&a.photos[s.photoIndex]&&<Photo photo={a.photos[s.photoIndex]}/>}{s.tickets&&<TicketBooking article={a}/>}
    </section>)}
    <TicketFaq article={a}/>
    <TicketNearby article={a}/>
    <nav aria-label="관련 여행 정보"><h2>함께 살펴볼 방문 정보</h2>{a.internalLinks.map(l=><p key={l.href}><Link href={l.href}>{l.label}</Link></p>)}</nav>
    <details><summary>확인한 자료와 출처</summary>{a.sources.map(s=><p key={s.url} className={styles.note}><a href={s.url} target="_blank" rel={s.url.includes('waug.com')?'sponsored noopener noreferrer':'noopener noreferrer'}>{s.label}</a> · {s.checkedAt.slice(0,10)}</p>)}</details>

  </main>;
}
