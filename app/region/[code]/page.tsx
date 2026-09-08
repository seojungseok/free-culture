import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {SIDO_SLUG,sidoFromSlug,GENRES} from '@/lib/classify';
import {regionHub} from '@/lib/regionHub';
import RegionHubCards from '@/components/RegionHubCards';
import {getByRegion} from '@/lib/data';
import RegionHubFilter from '@/components/RegionHubFilter';
import {formatKoreanDate} from '@/lib/dates';
export const revalidate=3600;
export function generateStaticParams(){return Object.values(SIDO_SLUG).map(code=>({code}));}
export async function generateMetadata({params}:{params:Promise<{code:string}>}):Promise<Metadata>{
 const {code}=await params,area=sidoFromSlug(code);if(!area)return {};
 const hub=regionHub(area,code);
 return {title:{absolute:`${area}에서 이번 주말 뭐하지? 가볼만한 곳·행사·나들이 | 주말에 뭐하지?`},description:`${area}의 ${hub.sections.slice(0,5).map(s=>s.label).join('·')}를 한곳에서 비교하세요. 날짜가 맞는 행사와 방문할 장소, 코스의 이용 조건을 확인할 수 있습니다.`,alternates:{canonical:`/region/${code}`}};
}
export default async function RegionPage({params}:{params:Promise<{code:string}>}){
 const {code}=await params,area=sidoFromSlug(code);if(!area)notFound();const {sections,recommended,weekend}=regionHub(area,code);
 const freeEvents=getByRegion(area).filter(e=>['free','free_estimated'].includes(e.priceType)&&e.startDate<=weekend.end&&e.endDate>=weekend.start);
 const freeGenres=GENRES.filter(g=>g.key!=='etc'&&freeEvents.some(e=>e.genreKey===g.key));
 const json=[{'@context':'https://schema.org','@type':'CollectionPage',name:`${area}에서 이번 주말 뭐하지?`,url:`https://mwohaji.kr/region/${code}`,mainEntity:{'@type':'ItemList',itemListElement:recommended.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.title,url:'https://mwohaji.kr'+p.href}))}},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:'https://mwohaji.kr'},{'@type':'ListItem',position:2,name:area,item:`https://mwohaji.kr/region/${code}`}]}];
 return <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8">
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>
 <nav aria-label="현재 위치" className="mb-4 text-xs text-ink-soft"><Link href="/">홈</Link> / {area}</nav>
 <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{area}에서 이번 주말 뭐하지?</h1>
 <p className="mt-3 text-sm leading-6 text-ink-soft">행사부터 나들이와 여행코스까지, {area}에서 보낼 하루를 골라보세요. 행사 추천 기준: {formatKoreanDate(weekend.start)} ~ {formatKoreanDate(weekend.end)}. 장소·코스의 실제 운영일은 상세에서 확인하세요.</p>
 <RegionHubFilter key={code} panels={[
 {key:'weekend',label:'이번 주말',content:<section id="weekend" className="py-3"><h2 className="text-xl font-extrabold">이번 주말 {area} 추천</h2><p className="mb-5 mt-2 text-xs leading-5 text-ink-soft">여러 종류에서 고르게 골랐습니다. 운영일·예약은 상세에서 확인하세요. 다른 종류를 선택하면 목록이 바뀝니다.</p><RegionHubCards items={recommended}/></section>},
 ...sections.map(s=>({key:s.key,label:s.label,content:<section id={s.key} className="py-3"><div className="mb-2 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">{s.label}</h2>{s.href&&<Link href={s.href} prefetch={false} className="shrink-0 text-sm font-bold text-brandblue">전체보기 →</Link>}</div><p className="mb-5 text-xs leading-5 text-ink-soft">{s.note}</p>
 {s.key==='events'&&freeGenres.length>0?<RegionHubFilter compact id="event-subtype" label="세부 분야" panels={[{key:'all',label:'전체 문화행사',content:<RegionHubCards items={s.items.slice(0,8)}/>},...freeGenres.map(g=>({key:g.key,label:`무료 ${g.label}`,content:<><p className="mb-4 text-xs text-ink-soft">무료·무료 추정 행사입니다. 상세 날짜와 이용 조건을 확인하세요.</p><RegionHubCards items={freeEvents.filter(e=>e.genreKey===g.key).slice(0,8).map(e=>({id:e.id,href:'/event/'+e.id,title:e.title,image:e.imgUrl||'',meta:e.place||area,badge:g.label}))}/><Link href={`/region/${code}/${g.key}`} prefetch={false} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brandblue">{area} 무료 {g.label} 전체보기 →</Link></>}))]}/>:<RegionHubCards items={s.items.slice(0,8)}/>}
 {s.items.length>8&&!s.href&&<details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-brandblue">{s.label} 더보기 ({s.items.length-8}개)</summary><ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">{s.items.slice(8).map(p=><li key={p.href}><Link href={p.href} prefetch={false} className="underline">{p.title}</Link></li>)}</ul></details>}</section>}))
 ]}/>
 </div>;
}
