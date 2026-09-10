import TicketLinks from '@/components/TicketLinks';
import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getTicket,getTickets,type TicketArticle} from '@/lib/tickets';
import {SITE} from '@/lib/site';
export const revalidate=3600;
export const dynamicParams=true;
export function generateStaticParams(){return getTickets().map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const a=getTicket((await params).slug);if(!a)return {title:'장소 안내를 찾을 수 없습니다',robots:{index:false,follow:false}};
  const image={url:a.thumbnail.url,width:a.thumbnail.width,height:a.thumbnail.height,alt:a.thumbnail.alt};
  return {title:a.title,description:a.description,alternates:{canonical:`/tickets/${a.slug}`},openGraph:{title:a.title,description:a.description,type:'article',url:`${SITE.url}/tickets/${a.slug}`,images:[image]},twitter:{card:'summary_large_image',title:a.title,description:a.description,images:[a.thumbnail.url]}};
}
export default async function TicketPage({params}:{params:Promise<{slug:string}>}){
  const a=getTicket((await params).slug);if(!a)notFound();
  const jsonLd={'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,image:[a.thumbnail.url],datePublished:a.publishedAt,dateModified:a.checkedAt,mainEntityOfPage:`${SITE.url}/tickets/${a.slug}`,author:{'@type':'Organization',name:SITE.name}};
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>
    <Link href="/tickets" className="text-sm font-bold text-free">← 입장권·체험</Link>
    <p className="mb-5 mt-6 rounded-xl bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-700">이 포스팅은 와그 파트너스 활동의 일환으로, 구매 시 이에 따른 일정액의 수수료를 제공받습니다.</p>
    <p className="text-sm font-bold text-free">{a.area} · {a.theme}</p><h1 className="mt-2 break-keep text-3xl font-black leading-tight sm:text-4xl">{a.title}</h1>
    <p className="mt-4 text-sm text-ink-soft">정보 확인 {a.checkedAt.slice(0,10)} · {a.address}</p>
    <figure className="my-7">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={a.thumbnail.url} alt={a.thumbnail.alt} width={a.thumbnail.width} height={a.thumbnail.height} className="h-auto w-full rounded-2xl object-contain" fetchPriority="high"/><figcaption className="mt-2 text-xs leading-5 text-ink-soft">{a.thumbnail.credit}</figcaption></figure>
    <p className="text-lg leading-8">{a.intro}</p>
    {a.sections.map((section,i)=><section key={i} className="mt-10"><h2 className="text-2xl font-bold leading-snug">{section.heading}</h2>{section.paragraphs.map((p,j)=><p key={j} className="mt-4 text-base leading-8 text-ink-soft">{p}</p>)}{section.photoIndex!==undefined&&a.photos[section.photoIndex]&&<figure className="my-6">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={a.photos[section.photoIndex].url} alt={a.photos[section.photoIndex].alt} width={a.photos[section.photoIndex].width} height={a.photos[section.photoIndex].height} className="h-auto w-full rounded-xl object-contain" loading="lazy"/><figcaption className="mt-2 text-xs leading-5 text-ink-soft">{a.photos[section.photoIndex].caption&&<span className="mb-1 block">{a.photos[section.photoIndex].caption}</span>}{a.photos[section.photoIndex].rightsUrl?<a href={a.photos[section.photoIndex].rightsUrl} target="_blank" rel="noopener noreferrer" className="underline">{a.photos[section.photoIndex].credit}</a>:a.photos[section.photoIndex].credit}</figcaption></figure>}{section.tickets&&<TicketLinks article={a}/>}</section>)}
    {!a.sections.some(s=>s.tickets)&&<TicketLinks article={a}/>}
    <nav className="mt-10 rounded-2xl bg-gray-50 p-5" aria-label="관련 여행 정보"><h2 className="font-bold">함께 계획해보세요</h2><div className="mt-3 flex flex-wrap gap-4">{a.internalLinks.map(l=><Link key={l.href} href={l.href} className="text-sm font-bold text-free">{l.label} →</Link>)}</div></nav>
    <details className="my-8 border-t border-line pt-5 text-sm text-ink-soft"><summary className="cursor-pointer font-bold">확인한 자료와 출처</summary><ul className="mt-3 space-y-3">{a.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a> · {s.checkedAt.slice(0,10)}</li>)}</ul></details>
  </main>;
}
