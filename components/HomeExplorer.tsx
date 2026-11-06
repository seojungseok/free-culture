"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SAVED_KEY, parseSaved, type TripStop } from "@/lib/planner";
import HomeRegionPicker from './HomeRegionPicker';
import HomeNearbyButton from './HomeNearbyButton';
import GamePromoBanner from './GamePromoBanner';
import TossAffiliate from './TossAffiliate';
import TossWinterHero from './TossWinterHero';
import TossTopDeals from './TossTopDeals';
import { useRenderDay } from "./RenderDate";
import { formatKoreanDate, weekendRangeYmd } from "@/lib/dates";
import {homeFilters,homeCandidates} from "@/lib/home-discovery.mjs";
import styles from './HomeExplorer.module.css';

export type HomeItem = { id: string; href: string; title: string; meta: string; image: string; imageAlt?:string; badge: string; area?: string; start?: string; end?: string; kids?:boolean;free?:boolean; description?:string; route?:string[]; duration?:string; tripDuration?:'당일'|'1박2일' };
type Props = { regional: Record<string, HomeItem[]>; eventItems: HomeItem[]; freeItems: HomeItem[]; kidItems: HomeItem[]; dateItems: HomeItem[]; campItems: HomeItem[]; courseItems: HomeItem[]; seasonItems: HomeItem[]; prepItems: HomeItem[]; placeItems: HomeItem[]; newItems: HomeItem[]; regions: { name: string; href: string }[]; siteName: string };
const savedKey = SAVED_KEY;
const regionalAreas: Record<string, string[]> = { 충청: ["충북", "충남", "대전", "세종"], 경상: ["경북", "경남", "부산", "대구", "울산"], 전라: ["전북", "전남", "광주"], 전국: [] };
const categories = [["🎭", "문화행사", "/events"], ["🌿", "나들이", "/places"], ["🗺️", "여행코스", "/course"], ["❄️", "겨울 여행지", "/winter-travel"], ["🚌", "시티투어", "/city-tour"], ["⛺", "캠핑", "/camping"], ["🍽️", "맛집탐방", "/food"], ["🐾", "반려동물 여행", "/pet-travel"], ["👨‍👩‍👧", "아이와 함께", "/kids"], ["💛", "데이트", "/date"], ["🧺", "준비 가이드", "/weekend-prep"]];

export default function HomeExplorer({ regional, eventItems, freeItems, kidItems, dateItems, campItems, courseItems, seasonItems, prepItems, placeItems, newItems, regions, siteName }: Props) {
  const day = useRenderDay();
  const weekend = weekendRangeYmd(day);
  const currentEventItems = eventItems.filter((item) => item.start && item.end && item.start <= weekend.end && item.end >= weekend.start);
  const currentFreeItems = freeItems.filter((item) => !item.end || item.end >= day);
  const weekendLabel = weekend.start === weekend.end ? formatKoreanDate(weekend.start) : `${formatKoreanDate(weekend.start)} ~ ${formatKoreanDate(weekend.end)}`;
  const router = useRouter(); const [intent,setIntent]=useState("all"); const [query, setQuery] = useState(""); const [region, setRegion] = useState("서울"); const [saved, setSaved] = useState<string[]>([]);
  useEffect(()=>{try{const last=localStorage.getItem('mwohaji-home-region');if(last&&Object.hasOwn(regional,last))setRegion(last);}catch{}},[regional]);
  const chooseRegion=(name:string)=>{setRegion(name);try{localStorage.setItem('mwohaji-home-region',name);}catch{}};
  const picks=homeCandidates(regional[region]||[],intent,day,weekend);
  const regionLinks = regions.filter((item) => (regionalAreas[region] || [region]).includes(item.name));
  useEffect(() => { const sync = () => { try { setSaved(parseSaved(localStorage.getItem(savedKey)).filter(t => t.stops.length === 1).map(t => t.stops[0].href)); } catch {} }; sync(); window.addEventListener("trip-saved", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("trip-saved", sync); window.removeEventListener("storage", sync); }; }, []);
  const submit = (event: FormEvent) => { event.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`); };
  const toggleSave = (item: HomeItem) => { try { const old = parseSaved(localStorage.getItem(savedKey)); const exists = old.some(t => t.stops.length === 1 && t.stops[0].href === item.href); if (!exists && old.length >= 100) { alert("보관함은 최대 100개까지 저장할 수 있어요."); return; } const kind: TripStop["kind"] = item.id.startsWith("event-") ? "event" : item.id.startsWith("camp-") ? "camp" : item.id.startsWith("course-") || item.id.startsWith("date-") ? "course" : "place"; const next = exists ? old.filter(t => !(t.stops.length === 1 && t.stops[0].href === item.href)) : [{ id: item.id, title: item.title, stops: [{ id: item.id, title: item.title, href: item.href, area: item.area || "", image: item.image, start: item.start, end: item.end, kind }] }, ...old]; localStorage.setItem(savedKey, JSON.stringify(next)); window.dispatchEvent(new Event("trip-saved")); } catch { alert("브라우저에서 저장을 허용한 뒤 다시 시도해 주세요."); } };
  return <div className={'home-explorer '+styles.home}>
    <section className={styles.searchArea} aria-label="여행 검색">
      <h1 className={styles.homeTitle}>이번 주말, 어디 갈까요?</h1>
      <form onSubmit={submit} className={styles.searchForm} role="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
        <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="지역·축제·여행지를 검색하세요" aria-label="지역, 축제, 아이와 갈 곳 검색"/>
        <button type="submit">검색</button>
      </form>
    </section>
    <nav className={styles.categories} aria-label="여행 카테고리"><div className={styles.categoryGrid}>{categories.filter(item=>item[2]!=='/pet-travel').map(([icon,label,href],index)=><Link key={label} href={href} prefetch={index<5?undefined:false} className={styles.category+(href==='/winter-travel'?' '+styles.seasonCategory:'')}><span className={styles.categoryIcon} aria-hidden="true">{icon}</span><span>{label}</span></Link>)}</div></nav>
    <nav className={styles.quickNav} aria-label="빠른 나들이 찾기"><HomeNearbyButton/><Link href="/weekend">이번 주말</Link><Link href="/plan">맞춤 추천</Link><Link href="/saved">♡ 보관함</Link></nav>
    <Section title="지역별 나들이" href="/places">
      <div className={styles.filterRow} role="group" aria-label="나들이 지역">{Object.keys(regional).map(name=><button type="button" key={name} onClick={()=>chooseRegion(name)} aria-pressed={region===name} className={styles.regionChip}>{name}</button>)}</div>
      <div role="group" aria-label="나들이 조건" className={styles.intentRow}>{homeFilters.map(([value,label])=><button type="button" key={value} onClick={()=>setIntent(value)} aria-pressed={intent===value} className={styles.intentChip}>{label}</button>)}</div>
      <p className={styles.resultsLabel} aria-live="polite">{region} · {intent==='all'?'가볼 만한 곳':homeFilters.find(([value])=>value===intent)?.[1]}</p>
      <Rail items={picks} limit={4} saved={saved} toggleSave={toggleSave} emptyMessage="선택한 지역·조건의 후보가 없습니다. 아래 지역 전체 목록에서 더 찾아보세요."/>
      <nav className={styles.regionLinks} aria-label={region+' 지역 전체 둘러보기'}>{regionLinks.map(item=><Link key={item.name} href={item.href} prefetch={false}>{item.name} 전체 둘러보기 →</Link>)}{region==='전국'&&<Link href="#home-region-title">방문할 지역 고르기 ↓</Link>}</nav>
    </Section>
    <TossWinterHero/>
    {seasonItems.length>0&&<HomeWinterCourses items={seasonItems}/>}
    <TossTopDeals/>
    {kidItems.length>0&&<Section title="아이와 어디 가지?" href="/kids"><Rail items={kidItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {dateItems.length>0&&<Section title="데이트·드라이브" href="/date" description="카페·산책·식사를 묶은 방문 후보예요. 상세에서 방문 순서와 실제 이동 경로를 확인하세요."><Rail items={dateItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {currentEventItems.length>0&&<Section title="이번 주말 행사" href="/weekend" description={weekendLabel+' 일정'}><Rail items={currentEventItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {courseItems.length>0&&<Section title="여행코스" href="/course"><Rail items={courseItems} saved={saved} toggleSave={toggleSave}/></Section>}
    <TossAffiliate position="top" compact collection="stay"/>
    {campItems.length>0&&<Section title="캠핑" href="/camping"><Rail items={campItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {prepItems.length>0&&<Section title="준비 가이드" href="/weekend-prep"><Rail items={prepItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {placeItems.length>0&&<Section title="대표 장소" href="/places"><Rail items={placeItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {newItems.length>0&&<Section title="새로 둘러볼 콘텐츠" href="/places"><Rail items={newItems} saved={saved} toggleSave={toggleSave}/></Section>}
    {currentFreeItems.length>0&&<Section title="가볼 만한 무료행사" href="/free" description="무료와 일부 조건에서 무료인 문화행사를 구분해 보여드려요."><Rail items={currentFreeItems} saved={saved} toggleSave={toggleSave}/></Section>}
    <HomeRegionPicker regions={regions}/>
    <GamePromoBanner/>
  </div>;
}
function Section({title,href,description,children}:{title:string;href:string;description?:string;children:React.ReactNode}){
 return <section className={styles.section}><div className={styles.sectionHeading}><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><Link href={href} className={styles.moreLink}>더보기 <span aria-hidden="true">›</span></Link></div>{children}</section>;
}
function Rail({items,saved,toggleSave,limit=4,emptyMessage="추천할 콘텐츠를 준비하고 있어요."}:{items:HomeItem[];saved:string[];toggleSave:(item:HomeItem)=>void;limit?:number;emptyMessage?:string}){
 if(!items.length)return <p className={styles.empty}>{emptyMessage}</p>;
 return <div className={styles.cardGrid}>{items.slice(0,limit).map((item,index)=><article key={item.id} className={styles.card}><Link href={item.href} prefetch={index===0?undefined:false} className={styles.cardLink}><div className={styles.cardImage}>{item.image&&<img src={item.image} alt={item.imageAlt||''} loading="lazy" decoding="async" width={360} height={225}/>}<span className={styles.cardBadge}>{item.badge}</span></div><div className={styles.cardBody}><h3>{item.title}</h3><p className={styles.cardMeta}>{item.meta}</p></div></Link><button type="button" onClick={()=>toggleSave(item)} aria-label={item.title+' '+(saved.includes(item.href)?'보관 취소':'보관')} aria-pressed={saved.includes(item.href)} className={styles.saveButton}>{saved.includes(item.href)?'♥':'♡'}</button></article>)}</div>;
}
function HomeWinterCourses({items}:{items:HomeItem[]}){
 const [area,setArea]=useState('전국');
 const [duration,setDuration]=useState<'all'|'daytrip'|'overnight'>('all');
 const durationItems=items.filter(item=>duration==='all'||item.tripDuration===(duration==='overnight'?'1박2일':'당일'));
 const areas=[...new Set(items.map(item=>item.area).filter((value):value is string=>Boolean(value)))];
 const featured=['서울','강원','부산','경기','전남','제주'].map((region,index)=>durationItems.find(item=>item.area===region&&(duration!=='all'||item.tripDuration===(index%2?'당일':'1박2일')))||durationItems.find(item=>item.area===region)).filter((item):item is HomeItem=>Boolean(item));
 const preview=[...featured,...durationItems.filter(item=>!featured.some(chosen=>chosen.id===item.id))].slice(0,4);
 const regionalCourses=area==='전국'?durationItems:durationItems.filter(item=>item.area===area);
 const courses=area==='전국'?preview:regionalCourses.slice(0,4);
 const query=new URLSearchParams();if(area!=='전국')query.set('area',area);if(duration!=='all')query.set('duration',duration);
 const allCoursesHref='/winter-travel'+(query.size?'?'+query:'');
 return <section className={styles.winterSection} aria-labelledby="home-winter-title">
  <div className={styles.sectionHeading}><h2 id="home-winter-title">겨울여행 <span className={styles.courseCount}>{items.length}코스</span></h2><Link href={allCoursesHref} className={styles.moreLink}>전체 코스 <span aria-hidden="true">→</span></Link></div>
  <div role="group" aria-label="홈 겨울 여행 일정" className={styles.filterRow}>{([['all','전체 일정'],['daytrip','당일치기'],['overnight','1박 2일']] as const).map(([value,label])=><button type="button" key={value} onClick={()=>setDuration(value)} aria-pressed={duration===value} className={styles.regionChip}>{label}</button>)}</div>
  <div role="group" aria-label="홈 겨울 여행 지역" className={styles.filterRow}>{['전국',...areas].map(value=><button type="button" key={value} onClick={()=>setArea(value)} aria-pressed={area===value} className={styles.regionChip}>{value}</button>)}</div>
  <p role="status" className={styles.resultsLabel}>{area} · 전체 {regionalCourses.length}개 코스</p>
  <div className={styles.winterGrid} data-home-winter-cards>{courses.map(item=><article key={item.id} className={styles.card+' '+styles.winterCard}><Link href={item.href} prefetch={false} className={styles.cardLink}><div className={styles.cardImage}>{item.image&&<img src={item.image} alt={item.imageAlt||item.title} width={640} height={400} loading="lazy" decoding="async"/>}<span className={styles.locationBadge}>{item.meta}</span></div><div className={styles.cardBody}><h3>{item.title}</h3>{item.route&&<p className={styles.route}>{item.route.join(' → ')}</p>}{item.description&&<p className={styles.description}>{item.description}</p>}<div className={styles.cardFooter}><span>{item.duration||'당일치기'}</span><span>코스 보기 <span aria-hidden="true">→</span></span></div></div></Link></article>)}</div>
  <Link href={allCoursesHref} className={styles.allCoursesLink}>{area} {regionalCourses.length}개 코스 보기 <span aria-hidden="true">→</span></Link>
 </section>;
}
