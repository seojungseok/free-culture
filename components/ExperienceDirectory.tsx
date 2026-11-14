import Link from 'next/link';
import {SIDO_LIST} from '@/lib/classify';
import {ruralThemes} from '@/lib/experiences.mjs';
import {experienceTopics,experienceUpdatedAt,currentExperiences,filterExperiences,experienceHref,experienceRegionHref,type ExperienceKind} from '@/lib/experienceData';
import {discoveryPageHref,queryValue,sourceDate,type DiscoveryQuery} from '@/lib/publicDiscovery';
import PublicDiscoverySchema from './PublicDiscoverySchema';
import ExperienceCard from './ExperienceCard';
import styles from './ExperienceBrowser.module.css';

export default function ExperienceDirectory({kind,query={},region=''}:{kind?:ExperienceKind;query?:DiscoveryQuery;region?:string}){
 const area=region||queryValue(query,'area'),city=queryValue(query,'city'),q=queryValue(query,'q').trim().slice(0,100),theme=queryValue(query,'theme'),cost=queryValue(query,'cost');
 const path=region?experienceRegionHref(region):kind?'/experiences/'+kind:'/experiences';
 const title=region?`${region} 체험 프로그램·농촌 체험`:kind?experienceTopics[kind].title:'전국 체험·교육 프로그램';
 const scoped=currentExperiences().filter(item=>!kind||item.kind===kind),records=filterExperiences(kind,query,region);
 const areaCounts=new Map(SIDO_LIST.map(sido=>[sido,scoped.filter(item=>item.area===sido).length]));
 const cities=[...new Set(scoped.filter(item=>item.area===area).map(item=>item.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
 const size=24,pages=Math.max(1,Math.ceil(records.length/size)),page=Math.min(pages,Math.max(1,Math.floor(Number(queryValue(query,'page'))||1))),shown=records.slice((page-1)*size,page*size);
 const topicHref=(topic?:ExperienceKind)=>{const base=topic?'/experiences/'+topic:'/experiences';return area?topic?base+'?area='+encodeURIComponent(area):experienceRegionHref(area):base;};
 const areaHref=(sido:string)=>kind?'/experiences/'+kind+(sido?'?area='+encodeURIComponent(sido):''):sido?experienceRegionHref(sido):'/experiences';
 return <div className={styles.page}>
  <PublicDiscoverySchema title={title} path={path} items={shown.map(item=>({name:item.title,url:experienceHref(item)}))}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/experiences">체험·교육</Link>{(kind||region)&&<><span>/</span><span>{region||experienceTopics[kind!].short}</span></>}</nav>
  <header className={styles.hero}><h1>{title}</h1><p>{kind?experienceTopics[kind].description:'만들기·과학·농촌 체험을 지역별로 찾아보세요. 대상과 일정, 비용을 비교하고 원하는 활동을 골라보세요.'}</p></header>
  <nav className={styles.topics} aria-label="체험 분야"><Link href={topicHref()} aria-current={!kind?'page':undefined}>전체</Link>{Object.keys(experienceTopics).map(key=><Link key={key} href={topicHref(key as ExperienceKind)} aria-current={key===kind?'page':undefined}>{({family:'가족·청소년',science:'과학관',rural:'농촌·어촌'})[key]}</Link>)}</nav>
  <nav className={styles.regions} aria-label="체험 지역"><Link href={areaHref('')} aria-current={!area?'page':undefined}>전국 <small>{scoped.length}</small></Link>{SIDO_LIST.map(sido=><Link key={sido} href={areaHref(sido)} aria-current={sido===area?'page':undefined}>{sido}<small>{areaCounts.get(sido)}</small></Link>)}</nav>
  <form action={path} className={styles.filters} aria-label="체험 찾기">
   {area&&!region&&<input type="hidden" name="area" value={area}/>}
   {!!cities.length&&<label>시·군·구<select name="city" defaultValue={city}><option value="">{area} 전체</option>{cities.map(name=><option key={name}>{name}</option>)}</select></label>}
   {kind==='rural'?<label>체험 종류<select name="theme" defaultValue={theme}><option value="">모든 체험</option>{Object.entries(ruralThemes).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label>:<label>참가비<select name="cost" defaultValue={cost}><option value="">전체</option><option value="free">무료로 등록된 활동</option></select></label>}
   <label className={styles.search}>체험·기관·지역 검색<input type="search" name="q" maxLength={100} defaultValue={q} placeholder="예: 두부, 만들기, 우주, 가평"/></label><button type="submit">체험 찾기</button><Link className={styles.reset} href={region?path:area?areaHref(area):path}>초기화</Link>
  </form>
  <p className={styles.count}>{area||'전국'} {city} · {records.length.toLocaleString()}개 체험</p>
  {shown.length?<div className={styles.grid}>{shown.map((item,index)=><ExperienceCard key={item.kind+'/'+item.id} item={item} priority={index<2}/>)}</div>:<p className={styles.empty}>선택한 조건의 체험이 없습니다. 검색어를 줄이거나 다른 지역을 골라보세요. <Link href={path}>검색 조건 초기화</Link></p>}
  {pages>1&&<nav className={styles.pagination} aria-label="체험 목록 페이지">{page>1&&<Link href={discoveryPageHref(path,query,page-1)}>이전 체험</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={discoveryPageHref(path,query,page+1)}>다음 체험</Link>}</nav>}
  <details className={styles.source}><summary>자료 출처와 확인 시각</summary><p>청소년 활동: 성평등가족부 방학 중 프로그램 목록·상세 API · {sourceDate(experienceUpdatedAt.family)}</p><p>농어촌 체험: 한국농어촌공사·한국어촌어항공단 표준데이터 · {sourceDate(experienceUpdatedAt.rural)}</p><p>과학관 교육: 국립중앙과학관·인천학생과학관 공식 일정 · {sourceDate(experienceUpdatedAt.science)}</p><p>마을·과학관 소개와 일부 전경 사진: 한국관광공사 TourAPI. 기관 사진이 없는 프로그램은 안내 이미지를 표시합니다.</p></details>
 </div>;
}
