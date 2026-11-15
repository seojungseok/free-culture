import Link from 'next/link';
import {SIDO_LIST} from '@/lib/classify';
import {ruralThemes} from '@/lib/experiences.mjs';
import {experienceTopics,experienceUpdatedAt,currentExperiences,filterExperiences,experienceHref,experienceRegionHref,type ExperienceKind} from '@/lib/experienceData';
import {discoveryPageHref,queryValue,sourceDate,type DiscoveryQuery} from '@/lib/publicDiscovery';
import {experienceDirectoryEditorial,experienceEditorial} from '@/lib/programmeEditorial.mjs';
import PublicDiscoverySchema from './PublicDiscoverySchema';
import ExperienceCard from './ExperienceCard';
import styles from './ExperienceBrowser.module.css';

export default function ExperienceDirectory({kind,query={},region=''}:{kind?:ExperienceKind;query?:DiscoveryQuery;region?:string}){
 const area=region||queryValue(query,'area'),city=queryValue(query,'city'),q=queryValue(query,'q').trim().slice(0,100),theme=queryValue(query,'theme'),cost=queryValue(query,'cost'),availability=queryValue(query,'availability');
 const path=region?experienceRegionHref(region):kind?'/experiences/'+kind:'/experiences';
 const scoped=currentExperiences(undefined,availability==='upcoming').filter(item=>kind?item.kind===kind:item.kind!=='rural'),records=filterExperiences(kind,query,region);
 const editorial=experienceDirectoryEditorial({region,kind,availability,records:scoped.filter(item=>!region||item.area===region)}),title=editorial.title;
 const villageCount=currentExperiences().filter(item=>item.kind==='rural'&&(!area||item.area===area)).length;
 const villageHref='/experiences/rural'+(area?'?area='+encodeURIComponent(area):'');
 const areaCounts=new Map(SIDO_LIST.map(sido=>[sido,scoped.filter(item=>item.area===sido).length]));
 const cities=[...new Set(scoped.filter(item=>item.area===area).map(item=>item.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
 const size=24,pages=Math.max(1,Math.ceil(records.length/size)),page=Math.min(pages,Math.max(1,Math.floor(Number(queryValue(query,'page'))||1))),shown=records.slice((page-1)*size,page*size);
 const topicHref=(topic?:ExperienceKind)=>{const base=topic?'/experiences/'+topic:'/experiences';return area?topic?base+'?area='+encodeURIComponent(area):experienceRegionHref(area):base;};
 const areaHref=(sido:string)=>kind?'/experiences/'+kind+(sido?'?area='+encodeURIComponent(sido):''):sido?experienceRegionHref(sido):'/experiences';
 return <div className={styles.page}>
  <PublicDiscoverySchema title={title} path={path} items={shown.map(item=>({name:experienceEditorial(item).title,url:experienceHref(item)}))}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/experiences">체험·교육</Link>{(kind||region)&&<><span>/</span><span>{region||experienceTopics[kind!].short}</span></>}</nav>
  <header className={styles.hero}><h1>{title}</h1><p>{editorial.introduction}</p></header>
  <nav className={styles.topics} aria-label="체험 분야"><Link href={topicHref()} aria-current={!kind?'page':undefined}>전체</Link>{Object.keys(experienceTopics).map(key=><Link key={key} href={topicHref(key as ExperienceKind)} aria-current={key===kind?'page':undefined}>{({family:'가족·청소년',science:'과학관',rural:'농촌·어촌'})[key]}</Link>)}</nav>
  <nav className={styles.regions} aria-label="체험 지역"><Link href={areaHref('')} aria-current={!area?'page':undefined}>전국 <small>{scoped.length}</small></Link>{SIDO_LIST.map(sido=><Link key={sido} href={areaHref(sido)} aria-current={sido===area?'page':undefined}>{sido}<small>{areaCounts.get(sido)}</small></Link>)}</nav>
  <form action={path} className={styles.filters} aria-label="체험 찾기">
   {area&&!region&&<input type="hidden" name="area" value={area}/>}
   {!!cities.length&&<label>시·군·구<select name="city" defaultValue={city}><option value="">{area} 전체</option>{cities.map(name=><option key={name}>{name}</option>)}</select></label>}
   {kind==='rural'?<label>체험 종류<select name="theme" defaultValue={theme}><option value="">모든 체험</option>{Object.entries(ruralThemes).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label>:<label>참가비<select name="cost" defaultValue={cost}><option value="">전체</option><option value="free">무료로 등록된 활동</option></select></label>}
   {kind!=='rural'&&<label>모집 상태<select name="availability" defaultValue={availability}><option value="">현재 접수기간 내</option><option value="upcoming">접수예정 프로그램</option></select></label>}
   <label className={styles.search}>체험·기관·지역 검색<input type="search" name="q" maxLength={100} defaultValue={q} placeholder="예: 두부, 만들기, 우주, 가평"/></label><button type="submit">체험 찾기</button><Link className={styles.reset} href={region?path:area?areaHref(area):path}>초기화</Link>
  </form>
  <p className={styles.currentOnlyNote}>{kind==='rural'?'체험마을의 기본 정보입니다. 날짜별 운영·참가비·예약 가능 여부는 마을에 확인해 주세요. 현재 모집 중인 행사 목록과 별도로 제공합니다.':'공식 안내의 접수기간이 남은 프로그램입니다. 접수 마감·활동 종료·모집 상태 미상은 제외하며, 잔여석과 실제 신청 가능 여부는 기관에서 최종 확인해 주세요.'}</p>
  <p className={styles.count}>{area||'전국'} {city} · {records.length.toLocaleString()}개 {kind==='rural'?'마을':'프로그램'}</p>
  {shown.length?<div className={styles.grid}>{shown.map((item,index)=><ExperienceCard key={item.kind+'/'+item.id} item={item} priority={index<2}/>)}</div>:<p className={styles.empty}>선택한 조건의 체험이 없습니다. 검색어를 줄이거나 다른 지역을 골라보세요. <Link href={path}>검색 조건 초기화</Link></p>}
  {pages>1&&<nav className={styles.pagination} aria-label="체험 목록 페이지">{page>1&&<Link href={discoveryPageHref(path,query,page-1)}>이전 체험</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={discoveryPageHref(path,query,page+1)}>다음 체험</Link>}</nav>}
  {kind!=='rural'&&villageCount>0&&<section className={styles.directoryGuide}><h2>체험마을은 예약 문의용 안내로 살펴보세요</h2><p>{area||'전국'} 체험마을 {villageCount.toLocaleString()}곳의 등록 체험과 사진·주소를 따로 모았습니다. 날짜별 모집·운영 상태가 없는 자료여서 현재 접수 중인 프로그램과 섞어 표시하지 않습니다.</p><Link href={villageHref}>농촌·어촌 체험마을 보기</Link></section>}
  <section className={styles.directoryGuide} aria-labelledby="experience-season-guide"><h2 id="experience-season-guide">겨울방학 체험·교육을 고르는 순서</h2><p>{editorial.winterNote}</p>{editorial.winterItems.length>0&&<ul>{editorial.winterItems.map(item=><li key={item.id}><Link href={experienceHref(item)}>{experienceEditorial(item).title}</Link><span> · {item.start}~{item.end}</span></li>)}</ul>}<ol><li>체험 내용에서 관심 있는 활동을 고르고, 실제 참여 가능한 나이와 학년을 확인하세요.</li><li>활동일과 접수기간을 따로 비교하세요. 일정이 남아 있어도 접수가 끝났을 수 있습니다.</li><li>농촌 체험은 계절·예약 인원, 강좌는 재료비·교재비와 보호자 동반 조건까지 확인하세요.</li></ol><p><Link href="/classes/family">어린이·가족 문화·체험 강좌</Link>에서 교육기간과 수강료도 함께 살펴볼 수 있습니다.</p></section>
  <details className={styles.source}><summary>자료 출처와 확인 시각</summary><p>청소년 활동: 성평등가족부 방학 중 프로그램 목록·상세 API · {sourceDate(experienceUpdatedAt.family)}</p><p>농어촌 체험: 한국농어촌공사·한국어촌어항공단 표준데이터 · {sourceDate(experienceUpdatedAt.rural)}</p><p>과학관 교육: 국립중앙과학관·인천학생과학관 공식 일정 · {sourceDate(experienceUpdatedAt.science)}</p><p>마을·과학관 소개와 일부 전경 사진: 한국관광공사 TourAPI. 기관 사진이 없는 프로그램은 안내 이미지를 표시합니다.</p></details>
 </div>;
}
