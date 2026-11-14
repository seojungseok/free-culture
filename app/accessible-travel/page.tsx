import type {Metadata} from 'next';
import Link from 'next/link';
import {SIDO_LIST} from '@/lib/classify';
import {ACCESSIBLE_SOURCE,ACCESS_FIELDS,familyFields} from '@/lib/accessible.mjs';
import {accessiblePlaces,accessibleUpdatedAt,discoveryPageHref,queryValue,sourceDate,type DiscoveryQuery} from '@/lib/publicDiscovery';
import {getAllPlaces} from '@/lib/tour';
import styles from '@/components/PublicDiscovery.module.css';
import PublicDiscoverySchema from '@/components/PublicDiscoverySchema';
export const revalidate=3600;
const title='이동·영유아 편의정보로 나들이 찾기';
const description='휠체어 출입구와 이동 경로, 장애인 화장실, 유모차 대여·수유실 등 공공 편의정보를 지역별로 확인하세요. 실제 이용 조건과 제한 사항을 함께 보여드립니다.';
export async function generateMetadata({searchParams}:{searchParams:Promise<DiscoveryQuery>}):Promise<Metadata>{return {title,description,alternates:{canonical:'/accessible-travel'},...(Object.values(await searchParams).some(Boolean)?{robots:{index:false,follow:true}}:{})};}
export default async function AccessibleTravelPage({searchParams}:{searchParams:Promise<DiscoveryQuery>}){
 const query=await searchParams,area=queryValue(query,'area'),feature=queryValue(query,'feature'),q=queryValue(query,'q').trim().slice(0,100);
 const all=accessiblePlaces(),places=all.filter(place=>!area||place.area===area).filter(place=>!q||[place.title,place.address].join(' ').includes(q)).filter(place=>feature==='family'?familyFields.some(key=>place.facts[key]):feature==='route'?!!(place.facts.route||place.facts.exit):feature==='restroom'?!!place.facts.restroom:true).sort((a,b)=>a.area.localeCompare(b.area,'ko')||a.title.localeCompare(b.title,'ko'));
 const size=24,pages=Math.max(1,Math.ceil(places.length/size)),page=Math.min(pages,Math.max(1,Math.floor(Number(queryValue(query,'page'))||1))),shown=places.slice((page-1)*size,page*size);
 const existing=new Set(getAllPlaces().map(place=>place.id));
 return <div className={styles.page}>
  <PublicDiscoverySchema title={title} path="/accessible-travel" items={shown.map(place=>({name:place.title,url:'/accessible-travel#place-'+place.id}))}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><span>이동·영유아 편의정보</span></nav>
  <header className={styles.hero}><h1>{title}</h1><p>함께 가는 사람에게 필요한 시설부터 살펴보세요. 한국관광공사의 무장애 여행 자료에서 확인된 출입구·이동 동선·화장실·영유아 편의 안내를 모았습니다.</p></header>
  <aside className={styles.note}>‘안내 있음’은 해당 항목에 설명이 있다는 뜻입니다. 불가·계단·경사 등 제한 설명도 포함됩니다. 휠체어·유모차 대여만으로 이동 가능 여부를 판단하지 말고, 방문할 구역의 출입구와 이동 동선을 함께 확인해 주세요.</aside>
  <form action="/accessible-travel" className={styles.filters} aria-label="편의정보로 장소 찾기">
   <label>지역<select name="area" defaultValue={area}><option value="">전국</option>{SIDO_LIST.map(sido=><option key={sido}>{sido}</option>)}</select></label>
   <label>살펴볼 안내<select name="feature" defaultValue={feature}><option value="">모든 편의 안내</option><option value="route">출입구·이동 동선 안내</option><option value="restroom">장애인 화장실 안내</option><option value="family">영유아 편의 안내</option></select></label>
   <label className={styles.search}>장소명·지역<input type="search" name="q" maxLength={100} defaultValue={q} placeholder="예: 박물관, 서울, 공원"/></label>
   <button type="submit">장소 찾기</button><Link href="/accessible-travel">검색 조건 초기화</Link>
  </form>
  <p className={styles.count}>{places.length}곳의 편의 안내<span>현재 상세 안내가 수록된 {all.length}곳을 보여드리며, 장소는 순차적으로 추가됩니다.</span></p>
  {!shown.length&&<p className={styles.note}>선택한 조건의 안내가 아직 수록되지 않았습니다. 지역이나 안내 조건을 넓혀 보세요.</p>}
  <div className={styles.results}>{shown.map(place=>{
   const keys=Object.keys(ACCESS_FIELDS).filter(key=>place.facts[key]),top=['exit','route','restroom',...familyFields].filter(key=>place.facts[key]).slice(0,3);
   const preview=top.length?top:keys.slice(0,3),remaining=keys.filter(key=>!preview.includes(key));
   return <article key={place.id} id={'place-'+place.id} className={styles.card}>
    <div className={styles.badges}><span>{place.area}</span><span>{place.type==='14'?'문화시설':'관광지'}</span>{familyFields.some(key=>place.facts[key])&&<span>영유아 안내 있음</span>}</div>
    <h2>{place.title}</h2><p className={styles.summary}>{place.address}</p>
    <dl className={styles.facts}>{preview.map(key=><div key={key} style={{display:'contents'}}><dt>{ACCESS_FIELDS[key as keyof typeof ACCESS_FIELDS]}</dt><dd>{place.facts[key]}</dd></div>)}</dl>
    {remaining.length>0&&<details className={styles.more}><summary>편의 안내 전체 {keys.length}항목 보기</summary><dl className={styles.facts}>{remaining.map(key=><div key={key} style={{display:'contents'}}><dt>{ACCESS_FIELDS[key as keyof typeof ACCESS_FIELDS]}</dt><dd>{place.facts[key]}</dd></div>)}</dl></details>}
    <div className={styles.actions}>{existing.has(place.id)&&<Link href={'/places/spot/'+place.id}>장소 이용 안내</Link>}<a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place.title+' '+place.address)} target="_blank" rel="noopener noreferrer">지도에서 위치 확인</a><a href={place.officialUrl} target="_blank" rel="noopener noreferrer">모두의여행에서 장소명 검색</a></div>
    <p className={styles.source}>상세자료 조회 {sourceDate(place.checkedAt)}<br/>출처: <a href={ACCESSIBLE_SOURCE} target="_blank" rel="noopener noreferrer">한국관광공사 무장애 여행 정보</a></p>
   </article>;
  })}</div>
  {pages>1&&<nav className={styles.pagination} aria-label="편의정보 목록 페이지">{page>1&&<Link href={discoveryPageHref('/accessible-travel',query,page-1)}>이전 장소</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={discoveryPageHref('/accessible-travel',query,page+1)}>다음 장소</Link>}</nav>}
  <aside className={styles.note}>출발 전 운영처에 이동 동선의 계단·경사, 엘리베이터 가동 여부, 화장실 위치, 대여 가능 시간과 이용 조건을 확인하세요. 이 목록은 편의정보를 확인하는 자료이며 시설 전체의 접근성을 인증하거나 무료 입장을 보장하지 않습니다.</aside>
  <p className={styles.source}>전국 목록 수집 확인 {sourceDate(accessibleUpdatedAt)} · 화~일요일 확인<br/><Link href="/classes/family">아이·가족 문화·체험 강좌</Link> / <Link href="/kids">아이와 갈 곳 더 보기</Link></p>
 </div>;
}
