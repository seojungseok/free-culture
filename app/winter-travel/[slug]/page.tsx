import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getPublicWinterCourses,getWinterCourse,type WinterPhoto} from '@/lib/winterCourses';
import {SITE} from '@/lib/site';
import {winterCourseImage} from '@/lib/winterCourseImage.mjs';
import TossTopDeals from '@/components/TossTopDeals';

export const revalidate=3600;
export const dynamicParams=false;
export function generateStaticParams(){return getPublicWinterCourses().map(({slug})=>({slug}));}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params,course=getWinterCourse(slug);
 if(!course)return {robots:{index:false,follow:true}};
 const photo=winterCourseImage(course);
 return {title:course.title,description:course.intro.slice(0,155),alternates:{canonical:'/winter-travel/'+slug},openGraph:{type:'article',title:course.title,description:course.intro.slice(0,155),publishedTime:course.publishedAt,modifiedTime:course.updatedAt||course.publishedAt,...(photo?{images:[{url:photo.src,alt:photo.alt,width:photo.width,height:photo.height}]}:{})}};
}
function safeSourceUrl(value:string):string|null{
 try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}
}
function formatDate(value:string){
 return Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'}):'';
}
function CoursePhoto({photo,priority=false}:{photo:WinterPhoto;priority?:boolean}){
 return <figure className="mt-5">
  <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':undefined} decoding="async" className="h-auto max-h-[580px] w-full rounded-2xl object-cover"/>
  <figcaption className="mt-2 text-xs leading-5 text-ink-soft">{photo.caption} · {photo.credit}</figcaption>
 </figure>;
}
const regionGroups=[['서울','인천','경기'],['강원'],['대전','세종','충북','충남'],['광주','전북','전남'],['부산','대구','울산','경북','경남'],['제주']];

export default async function WinterCoursePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,course=getWinterCourse(slug);
 if(!course)notFound();
 const canonical=SITE.url+'/winter-travel/'+course.slug;
 const photo=winterCourseImage(course);
 const checkedAt=course.lastReviewedAt||course.updatedAt||course.publishedAt;
 const overnight=course.duration==='1박2일';
 const durationText=overnight?'1박 2일':'당일치기';
 const imageUrls=[...new Set([photo,...course.stops.flatMap(stop=>[stop.photo,...(stop.gallery||[])]).map(image=>winterCourseImage({image}))].filter(Boolean).map(image=>new URL(image.src,SITE.url).href))];
 const breadcrumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
  {'@type':'ListItem',position:1,name:'홈',item:SITE.url},
  {'@type':'ListItem',position:2,name:'겨울여행',item:SITE.url+'/winter-travel'},
  {'@type':'ListItem',position:3,name:course.title,item:canonical},
 ]};
 const organization={'@type':'Organization',name:SITE.name,url:SITE.url};
 const article={'@context':'https://schema.org','@type':'Article',headline:course.title,description:course.intro,datePublished:course.publishedAt,dateModified:course.updatedAt||course.publishedAt,mainEntityOfPage:canonical,url:canonical,inLanguage:'ko-KR',image:imageUrls,author:organization,publisher:organization,citation:(course.sources||[]).map(source=>safeSourceUrl(source.url)).filter(Boolean)};
 const json=(value:object)=>JSON.stringify(value).replace(/</g,'\\u003c');
 const renderedPhotos=new Set<string>(photo?[photo.src]:[]);
 const relatedArea=regionGroups.find(group=>group.includes(course.area))||[course.area];
 const related=getPublicWinterCourses().filter(item=>item.slug!==course.slug).sort((a,b)=>Number(b.area===course.area)-Number(a.area===course.area)||Number(relatedArea.includes(b.area))-Number(relatedArea.includes(a.area))).slice(0,3);
 return <article className="mx-auto max-w-[880px] px-4 pb-14 pt-5 sm:px-6">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:json(breadcrumbs)}}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:json(article)}}/>
  <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-x-2 text-xs text-ink-soft"><Link href="/" className="inline-flex min-h-11 items-center hover:underline">홈</Link><span aria-hidden="true">/</span><Link href="/winter-travel" className="inline-flex min-h-11 items-center hover:underline">겨울 여행</Link><span aria-hidden="true">/</span><span aria-current="page">{[...new Set([course.area,course.city].filter(Boolean))].join(' · ')}</span></nav>
  <header className="pt-4">
   <p className="text-sm font-bold text-brandblue">{[...new Set([course.area,course.city,durationText].filter(Boolean))].join(' · ')}</p>
   <h1 className="mt-3 break-keep text-[28px] font-black leading-[1.4] tracking-tight text-ink sm:text-4xl sm:leading-[1.35]">{course.title}</h1>
   <p className="mt-4 text-[15px] leading-8 text-ink-soft sm:text-base">{course.intro}</p>
   <p className="mt-3 text-xs leading-6 text-ink-soft">정보 확인 <time dateTime={checkedAt}>{formatDate(checkedAt)}</time></p>
   <dl className="mt-5 grid gap-4 rounded-2xl bg-[#f3f6fa] p-5 sm:grid-cols-3">
    {[[course.startPoint,'출발 지점'],[course.transport,'이동 방식'],[course.durationLabel,'현지 일정']].filter(([value])=>value).map(([value,label])=><div key={label} className="min-w-0"><dt className="text-xs text-ink-soft">{label}</dt><dd className="mt-1 break-keep text-sm font-bold leading-6 text-ink">{value}</dd></div>)}
   </dl>
   {course.overnightArea&&<p className="mt-3 rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-ink-soft"><strong className="text-ink">숙박 권역</strong> · {course.overnightArea}</p>}
  </header>
  {photo&&<CoursePhoto photo={photo} priority/>}
  <nav className="mt-7 rounded-2xl border border-slate-200 p-5" aria-label={overnight?'1박 2일 코스 순서':'하루 코스 순서'}>
   <h2 className="text-lg font-black text-ink">{overnight?'1박 2일 일정':'하루 코스'}</h2>
   {(overnight?[1,2]:[1]).map(day=><div key={day} className="mt-4">{overnight&&<h3 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-ink">{day}일차</h3>}<ol className="mt-2 space-y-1">{course.stops.map((stop,index)=>stop.day===day?<li key={stop.placeId}><a href={'#stop-'+(index+1)} className="flex min-h-11 items-center gap-3 text-sm font-bold text-brandblue"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs">{index+1}</span><span className="min-w-0 break-keep">{stop.name}</span><span className="ml-auto shrink-0 text-xs font-normal text-ink-soft">{stop.timeLabel}</span></a></li>:null)}</ol></div>)}
  </nav>
  {course.stops.map((stop,index)=>{
   const official=stop.officialUrl?safeSourceUrl(stop.officialUrl):null;
   const stopPhotos=[stop.photo,...(stop.gallery||[])].map(image=>winterCourseImage({image})).filter(image=>{if(!image||renderedPhotos.has(image.src))return false;renderedPhotos.add(image.src);return true;});
   return <section key={stop.placeId} id={'stop-'+(index+1)} className="mt-10 scroll-mt-24">
    <p className="text-xs font-bold text-brandblue">{[overnight?`${stop.day}일차`:null,stop.timeLabel,stop.stay].filter(Boolean).join(' · ')}</p>
    <h2 className="mt-2 break-keep text-2xl font-black leading-9 tracking-tight text-ink">{index+1}. {stop.name}</h2>
    {stop.description&&<p className="mt-3 whitespace-pre-line text-[15px] leading-8 text-ink-soft">{stop.description}</p>}
    {stopPhotos.map(image=><CoursePhoto key={image.src} photo={image}/>)}
    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">{stop.addr&&<p className="break-words text-sm leading-6 text-ink-soft">{stop.addr}</p>}<div className="flex flex-wrap gap-x-5"><a href={'https://map.naver.com/p/search/'+encodeURIComponent([stop.addr,stop.name].filter(Boolean).join(' '))} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-brandblue">네이버 지도 ↗</a>{official&&<a href={official} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-brandblue">공식 안내 ↗</a>}</div></div>
   </section>;
  })}
  {course.sections.map((section,index)=><section key={section.heading+'-'+index} className="mt-10"><h2 className="break-keep text-xl font-black leading-8 text-ink">{section.heading}</h2>{section.paragraphs.map((paragraph,i)=><p key={i} className="mt-3 whitespace-pre-line text-[15px] leading-8 text-ink-soft">{paragraph}</p>)}</section>)}
  <aside className="mt-10 rounded-2xl border border-slate-200 p-5">
   <h2 className="text-base font-extrabold text-ink">출처와 확인일</h2>
   <p className="mt-2 text-sm leading-7 text-ink-soft">체류 시간은 여행 계획용 제안입니다. 휴무·예약·요금과 겨울철 통제 여부는 출발 전 공식 안내를 확인하세요.</p>
   <ul className="mt-3 space-y-2">{(course.sources||[]).map((source,index)=>{const url=safeSourceUrl(source.url);return url?<li key={url+'-'+index} className="text-sm leading-6"><a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brandblue underline underline-offset-4">{source.title} ↗</a>{source.checkedAt&&<time dateTime={source.checkedAt} className="mt-0.5 block text-xs text-ink-soft">{formatDate(source.checkedAt)} 확인</time>}</li>:null;})}</ul>
  </aside>
  <TossTopDeals contained/>
  <section className="mt-10" aria-labelledby="related-winter-title">
   <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="related-winter-title" className="text-xl font-black text-ink">다른 겨울여행 코스</h2><Link href={'/winter-travel?area='+encodeURIComponent(course.area)} className="inline-flex min-h-11 items-center text-sm font-bold text-brandblue">{course.area} 코스 보기 →</Link></div>
   <div className="mt-3 grid gap-4 sm:grid-cols-3">{related.map(item=>{const image=winterCourseImage(item);return <Link key={item.slug} href={'/winter-travel/'+item.slug} prefetch={false} className="overflow-hidden rounded-xl border border-slate-200">{image&&<img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover"/>}<div className="p-4"><p className="text-xs font-semibold text-brandblue">{[item.area,item.city].filter(Boolean).join(' · ')}</p><h3 className="mt-2 break-keep text-sm font-bold leading-6 text-ink">{item.title}</h3></div></Link>;})}</div>
  </section>
  <Link href="/winter-travel" className="mt-8 inline-flex min-h-11 items-center font-bold text-brandblue">← 전국 겨울여행 코스</Link>
 </article>;
}
