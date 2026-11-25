import ArticleProducts from '@/components/ArticleProducts';
import type {Metadata} from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {getPlaygroundGuides,getPlaygroundGuide,getGuideFacilities,getGuideTour,getGuideState,getOperationReview,getGuideAddress,guideFirstPublishedAt,guideModifiedAt,playgroundDate,playgroundMap,playgroundBrowseHref,playgroundSeason} from '@/lib/playgroundData';
import {isPlaygroundCandidate,PLAYGROUND_SOURCE} from '@/lib/playgrounds.mjs';
import {withSearchMetadata} from '@/lib/searchMetadata';
import {SITE} from '@/lib/site';
import {currentAccessiblePlace} from '@/lib/publicDiscovery';
import FamilyVenueAccess from '@/components/FamilyVenueAccess';
import PlaygroundCard from '@/components/PlaygroundCard';
import styles from '@/components/Playgrounds.module.css';
import browse from '@/components/ExperienceBrowser.module.css';
export const dynamicParams=false;
export const revalidate=3600;
export function generateStaticParams(){return getPlaygroundGuides().map(g=>({slug:g.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const guide=getPlaygroundGuide((await params).slug);
 if(!guide)return {title:'안내글을 찾을 수 없습니다',robots:{index:false,follow:true}};
 const tour=getGuideTour(guide);
 return withSearchMetadata({title:guide.title,description:guide.description,alternates:{canonical:'/playgrounds/'+guide.slug},robots:getGuideState(guide)?undefined:{index:false,follow:true},openGraph:{type:'article',publishedTime:guideFirstPublishedAt(guide),modifiedTime:guideModifiedAt(guide),images:tour.photos.map(p=>({url:p.src,alt:p.alt}))}});
}
export default async function PlaygroundDetail({params}:{params:Promise<{slug:string}>}){
 const guide=getPlaygroundGuide((await params).slug);if(!guide)notFound();
 const tour=getGuideTour(guide),facilities=getGuideFacilities(guide),current=getGuideState(guide),review=getOperationReview(guide),address=getGuideAddress(guide),visit=guide.visit,today=playgroundSeason().today,url=SITE.url+'/playgrounds/'+guide.slug;
 const publishedAt=guideFirstPublishedAt(guide),modifiedAt=guideModifiedAt(guide),amenities=(tour.extra||[]).filter(p=>['화장실','이용가능시설'].includes(p.name));
 const stroller=tour.intro.chkbabycarriage||tour.intro.chkbabycarriageculture;
 const venueFacts=[
  ['체험 프로그램',tour.intro.expguide],['유모차 대여',currentAccessiblePlace(guide.tourId)?.facts.stroller?'':stroller]
 ].filter(([,value])=>value&&value.trim());
 const ld=[{'@context':'https://schema.org','@type':'Article',headline:guide.title,description:guide.description,inLanguage:'ko-KR',mainEntityOfPage:url,datePublished:publishedAt,dateModified:modifiedAt,author:{'@type':'Organization',name:SITE.name,url:SITE.url},publisher:{'@type':'Organization',name:SITE.name,url:SITE.url},image:tour.photos.map(p=>SITE.url+p.src),about:{'@type':'Place',name:guide.name,address,...(tour.common?.latitude&&tour.common?.longitude?{geo:{'@type':'GeoCoordinates',latitude:tour.common.latitude,longitude:tour.common.longitude}}:{})},citation:[PLAYGROUND_SOURCE,...guide.sources.map(s=>s.url)]},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:SITE.url},{'@type':'ListItem',position:2,name:'어린이 놀이터',item:SITE.url+'/playgrounds'},{'@type':'ListItem',position:3,name:guide.name,item:url}]}];
 const facts=[['주소',address],['이용요금',visit.fee],['무료·감면 조건',visit.feeDetails],['이용시간',visit.hours],['예약·발권',visit.booking],['이용 대상',visit.age],['주차',visit.parking],['휴관일',visit.closed],['전화',visit.phone]];
 return <div className={styles.page}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  <nav className={browse.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><Link href="/playgrounds">어린이 놀이터</Link><span>›</span><span aria-current="page">{guide.name}</span></nav>
  <header className={styles.detailHeader}><p className={styles.eyebrow}>{guide.area} {guide.district} · {guide.indoor?'실내 놀이터':'공원·야외 놀이터'}</p><h1>{guide.title}</h1><p>{guide.intro}</p></header>
  <p className={styles.stamp}>{SITE.name} 편집 · <time dateTime={modifiedAt}>최근 수정 {new Date(modifiedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time></p>
  {!current&&<aside className={styles.notice}><strong>현재 운영시설 목록에서 확인되지 않습니다.</strong><p>아래 글은 보관된 안내입니다. 현재 이용 가능 여부는 운영기관 확인이 필요합니다.</p></aside>}
  {review?.exceptions.filter(e=>e.end>=today).map(e=><aside className={styles.notice} key={e.start}><strong>날짜별 운영 알림</strong><p>{e.label}</p><a href={e.source} target="_blank" rel="noopener noreferrer">운영기관 공지 보기 ↗</a></aside>)}
  <section className={styles.visitSummary} aria-labelledby="visit-summary"><h2 id="visit-summary">이용정보 한눈에 보기</h2><dl>{facts.map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><div className={styles.actions}>{visit.bookingUrl&&<a href={visit.bookingUrl} target="_blank" rel="noopener noreferrer">{guide.indoor?'예약·발권 안내':'공식 이용안내'} ↗</a>}<a href={playgroundMap(guide.name,address)} target="_blank" rel="noopener noreferrer">네이버지도 길찾기 ↗</a><a href={'tel:'+visit.phone.split('~')[0].replace(/[^0-9+]/g,'')}>전화 문의</a></div></section>
  <figure className={styles.cover}><Image src={tour.photos[0].src} alt={tour.photos[0].alt} unoptimized data-license={tour.photos[0].license} width={1600} height={1000} sizes="(max-width:1120px) 100vw,1056px" priority/><figcaption>{tour.photos[0].alt} · {tour.photos[0].credit} · <a href={tour.photos[0].original} target="_blank" rel="noopener noreferrer">사진 원본</a></figcaption></figure>
  <article className={styles.article}><div className={styles.guideText}>{guide.sections.filter(s=>!('showUntil' in s)||String(s.showUntil)>=today).map((section,i)=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(p=><p key={p}>{p}</p>)}{i===1&&tour.photos[1]&&<figure className={styles.cover}><Image src={tour.photos[1].src} alt={tour.photos[1].alt} unoptimized data-license={tour.photos[1].license} width={1600} height={1000} sizes="(max-width:1023px) 100vw,820px"/><figcaption>{tour.photos[1].alt} · {tour.photos[1].credit} · <a href={tour.photos[1].original} target="_blank" rel="noopener noreferrer">사진 원본</a></figcaption></figure>}</section>)}</div>
   {venueFacts.length>0&&<section className={styles.amenities}><h2>{tour.common?.title||guide.name} 방문 정보</h2><dl>{venueFacts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className={styles.stamp}>한국관광공사 장소 안내 · {playgroundDate(tour.checkedAt)} 확인</p></section>}
   <FamilyVenueAccess venueId={guide.tourId} generalStroller={stroller}/>
   {amenities.length>0&&<section className={styles.amenities} aria-labelledby="playground-amenities"><h2 id="playground-amenities">편의시설</h2><dl>{amenities.map(p=><div key={p.name}><dt>{p.name}</dt><dd>{p.content}</dd></div>)}</dl></section>}
  <ArticleProducts/>
   <details className={styles.source}><summary>출처와 이용정보 확인일</summary><p>운영기관과 공공 관광자료를 바탕으로 작성한 방문 안내입니다. 현장 점검·예약 잔여석은 운영기관의 현재 안내를 따릅니다.</p><ul>{guide.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}<li>한국관광공사 관광정보: 장소·주소·이용요금·주차·편의시설 · 상세 조회 {playgroundDate(tour.detailsCheckedAt||tour.checkedAt)}</li><li>관광정보 운영시간 조회 {playgroundDate(tour.checkedAt)}{review?.checkedAt&&' · 운영기관 안내 대조 '+playgroundDate(review.checkedAt)}</li></ul>{(tour.introChangedSinceReview||tour.detailsChangedSinceReview||review?.status==='review-required')&&<p>운영안내에 변경이 있어 재확인 중입니다. 위 요금·시간은 글 작성 당시의 안내이며 공식 사이트의 최신 안내를 적용합니다.</p>}<p>사진: 한국관광공사 관광콘텐츠랩. 사진별 이용조건과 원본 링크를 표시했습니다. 자료사진의 촬영 계절은 방문 시점과 다를 수 있으며, 변경금지 사진은 원본 파일을 편집하지 않고 제공합니다.</p></details>
   <details className={styles.source}><summary>공공 놀이시설 등록내역</summary><p><a href={PLAYGROUND_SOURCE} target="_blank" rel="noopener noreferrer">행정안전부 전국어린이놀이시설정보서비스</a>의 등록자료입니다. 하나의 공원에 여러 놀이시설이 등록될 수 있습니다.</p>{facilities.map(p=><div className={styles.registeredRow} key={p.id}><strong>{p.name}</strong><p>{p.address} · {isPlaygroundCandidate(p)?'운영 등록':'현재 목록 미확인'} · {p.indoorOutdoor}</p><small>시설번호 {p.id} · 조회 {playgroundDate(p.checkedAt)}</small></div>)}</details>
  </article>
  <section className={styles.related} aria-labelledby="related-playgrounds"><div className={styles.sectionHeading}><h2 id="related-playgrounds">다른 놀이터 이용안내</h2><Link href={playgroundBrowseHref(guide.area)}>{guide.area} 더 보기 →</Link></div><div className={browse.grid}>{getPlaygroundGuides().filter(g=>g.slug!==guide.slug&&getGuideState(g)).slice(0,4).map(g=><PlaygroundCard key={g.slug} guide={g}/>)}</div></section>
 </div>;
}
