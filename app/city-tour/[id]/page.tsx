import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getCityTour,getCityTours,CITY_SOURCE,type CityLink} from '@/lib/cityTours';
import TripSave from '@/components/TripSave';
import CourseShare from '@/components/CourseShare';
const INFO_LABELS:Record<string,string>={'시티투어코스명':'코스 이름','시티투어탑승장소명':'탑승 장소','시티투어코스정보':'경유 순서','시티투어운영시간':'운영일·시간','운행정보':'운행 조건','운행시작시각':'시작 시각','운행종료시각':'종료 시각','이용요금':'이용 요금','이용요금부가정보':'요금 안내','시티투어문의처':'문의처'};
export function generateStaticParams(){return getCityTours().map(a=>({id:a.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const a=getCityTour(id);if(!a)return {};return {title:a.title,description:a.description,alternates:{canonical:'/city-tour/'+a.id},openGraph:{title:a.title,description:a.description,type:'article',...(a.image?{images:[{url:a.image,alt:a.imageTitle}]}:{})}};}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params,a=getCityTour(id);if(!a)notFound();const others=getCityTours().filter(x=>x.id!==a.id&&x.area===a.area).slice(0,3);
 const json=[{'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,datePublished:a.publishedAt,dateModified:a.publishedAt,mainEntityOfPage:'https://mwohaji.kr/city-tour/'+a.id,author:{'@type':'Organization',name:'주말에 뭐하지?'},...(a.image?{image:[a.image]}:{})},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{ '@type':'ListItem',position:1,name:'홈',item:'https://mwohaji.kr'},{'@type':'ListItem',position:2,name:'시티투어',item:'https://mwohaji.kr/city-tour'},{'@type':'ListItem',position:3,name:a.title,item:'https://mwohaji.kr/city-tour/'+a.id}]}];
 return <article className="mx-auto max-w-3xl px-5 py-8 [overflow-wrap:anywhere]">
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>
 <nav className="mb-5 text-sm"><Link href="/">홈</Link> / <Link href="/city-tour">시티투어</Link> / {a.area}</nav>
 <p className="text-sm font-bold text-brandblue">{a.area} {a.city==='없음'?'':a.city}</p><h1 className="mt-2 break-keep text-2xl font-black leading-snug sm:text-3xl">{a.title}</h1>
 <div className="my-5 flex flex-wrap items-start gap-3"><TripSave className="" trip={{id:'city:'+a.id,title:a.title,stops:[{id:'city:'+a.id,title:a.title,href:'/city-tour/'+a.id,area:a.area,kind:'course'}]}}/><CourseShare title={a.title} compact/></div>
 <aside className="mb-6 rounded-xl bg-amber-50 p-4 text-sm leading-7">원본 기준일: {a.raw['데이터기준일자']}. 아래 운행·요금은 해당 자료의 내용이며 현재 예약 가능 여부를 보장하지 않습니다. 한시적 일정·최소 인원·휴무 조건을 공식 운영처에 확인하세요.</aside>
 {a.image&&<figure className="mb-7"><img src={a.image} alt={a.imageTitle} className="aspect-[16/9] w-full rounded-2xl object-cover"/><figcaption className="mt-2 text-xs text-ink-faint">경유지 {a.imageTitle} · 한국관광공사 제공 사진 (실제 투어 차량 사진이 아닙니다)</figcaption></figure>}
 <p className="mb-8 text-base leading-8">{a.intro}</p>
 <nav aria-label="글 목차" className="mb-8 rounded-xl bg-slate-50 p-5"><p className="mb-3 font-bold">이 글에서 확인할 내용</p><ol className="space-y-2 text-sm">{a.sections.map((s,i)=><li key={i}><a href={'#section-'+i} className="underline underline-offset-4">{s.heading}</a></li>)}<li><a href="#visit-info" className="underline">원본 이용 정보</a></li></ol></nav>
 {a.sections.map((s,i)=><section id={'section-'+i} key={i} className="mb-9 scroll-mt-24"><h2 className="mb-4 text-xl font-extrabold">{s.heading}</h2><div className="space-y-4 text-[15px] leading-8 text-ink-soft">{s.paragraphs.map((p,j)=><p key={j}>{p}</p>)}</div></section>)}
 <section id="visit-info" className="scroll-mt-24"><h2 className="mb-4 text-xl font-extrabold">원본 이용 정보</h2><dl className="divide-y rounded-2xl border p-5">{Object.keys(INFO_LABELS).filter(k=>a.raw[k]).map(k=><div key={k} className="py-3"><dt className="mb-1 text-sm font-bold">{INFO_LABELS[k]}</dt><dd className="whitespace-pre-line text-sm leading-7 text-ink-soft">{a.raw[k]}</dd></div>)}</dl>
 {a.officialUrl&&<a href={a.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brandblue px-5 font-bold text-white">공식 운영 안내 확인</a>}</section>
 <Connections title="코스 경유지 자세히 보기" items={a.related}/>
 {a.foodLinks.length>0&&<><p className="mt-8 text-sm leading-6 text-ink-soft">아래 음식점은 기존 관광정보에서 경유지 인근 후보를 연결한 것입니다. 공식 투어 포함 식사나 예약 보장 식당은 아니며 이동 경로와 영업 여부를 확인하세요.</p><Connections title="함께 살펴볼 식사 후보" items={a.foodLinks}/></>}
 {others.length>0&&<section className="mt-8"><h2 className="mb-4 text-xl font-bold">같은 지역의 다른 시티투어</h2><ul className="space-y-3">{others.map(t=><li key={t.id}><Link href={'/city-tour/'+t.id} className="text-brandblue underline">{t.title}</Link></li>)}</ul></section>}
 <div className="mt-8 flex flex-wrap gap-4 text-sm"><Link href="/city-tour" className="underline">전체 시티투어</Link><Link href="/plan" className="underline">다른 나들이 직접 고르기</Link><Link href="/saved" className="underline">보관함 보기</Link></div>
 <footer className="mt-8 border-t pt-5 text-xs leading-6 text-ink-faint">출처: <a href={CITY_SOURCE} className="underline">전국시티투어정보표준데이터</a> · {a.raw['관리기관명']}. 원본 기준일 {a.raw['데이터기준일자']}. AI 보조 작성 후 자료 대조 검수를 거친 안내이며 실시간 운행 확인이나 직접 탑승 후기가 아닙니다.</footer>
 </article>;}
function Connections({title,items}:{title:string;items:CityLink[]}){if(!items.length)return null;return <section className="mt-8"><h2 className="mb-4 text-xl font-bold">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{items.map(p=><Link key={p.href} href={p.href} prefetch={false} className="overflow-hidden rounded-xl border">{p.image&&<img src={p.image} alt={p.title} loading="lazy" className="aspect-[16/9] w-full object-cover"/>}<div className="p-4"><h3 className="font-bold">{p.title}</h3><p className="mt-2 text-sm text-ink-soft">{p.address}</p></div></Link>)}</div></section>;}
