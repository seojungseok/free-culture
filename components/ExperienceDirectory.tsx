import Link from 'next/link';
import {SIDO_LIST} from '@/lib/classify';
import {ruralThemes} from '@/lib/experiences.mjs';
import {experienceTopics,experienceUpdatedAt,ruralExperiences,youthExperiences,scienceExperiences,type ExperienceKind,type RuralExperience,type YouthExperience,type ScienceExperience} from '@/lib/experienceData';
import {discoveryPageHref,queryValue,sourceDate,todayIso,type DiscoveryQuery} from '@/lib/publicDiscovery';
import PublicDiscoverySchema from './PublicDiscoverySchema';
import styles from './PublicDiscovery.module.css';

export default function ExperienceDirectory({kind,query}:{kind:ExperienceKind;query:DiscoveryQuery}){
 const topic=experienceTopics[kind],path='/experiences/'+kind,today=todayIso(),area=queryValue(query,'area'),q=queryValue(query,'q').trim().slice(0,100),theme=queryValue(query,'theme'),cost=queryValue(query,'cost');
 const list: (RuralExperience|YouthExperience|ScienceExperience)[]=kind==='rural'?ruralExperiences():kind==='science'?scienceExperiences():youthExperiences();
 const records=list.filter(record=>!area||record.area===area).filter(record=>!q||JSON.stringify(record).includes(q)).filter(record=>kind!=='family'||cost!=='free'||(record as YouthExperience).free).filter(record=>kind!=='rural'||!Object.hasOwn(ruralThemes,theme)||ruralThemes[theme as keyof typeof ruralThemes].test.test((record as RuralExperience).programs.join(' ')+' '+(record as RuralExperience).programType)).sort((a,b)=>{
  if(kind==='rural')return a.area.localeCompare(b.area,'ko')||a.title.localeCompare(b.title,'ko');
  if(kind==='science'){
   const aClosed=Number(!!(a as ScienceExperience).registrationEnd&&(a as ScienceExperience).registrationEnd<today),bClosed=Number(!!(b as ScienceExperience).registrationEnd&&(b as ScienceExperience).registrationEnd<today);
   if(aClosed!==bClosed)return aClosed-bClosed;
  }
  return ('start' in a?a.start:'').localeCompare('start' in b?b.start:'');
 });
 const size=24,pages=Math.max(1,Math.ceil(records.length/size)),page=Math.min(pages,Math.max(1,Math.floor(Number(queryValue(query,'page'))||1))),shown=records.slice((page-1)*size,page*size);
 return <div className={styles.page}>
  <PublicDiscoverySchema title={topic.title} path={path} items={shown.map(record=>({name:record.title,url:path+'#experience-'+record.id}))}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/experiences">주말 체험</Link><span>/</span><span>{topic.short}</span></nav>
  <header className={styles.hero}><h1>{topic.title}</h1><p>{topic.description}</p></header>
  <nav className={styles.tabs} aria-label="체험 주제">{Object.entries(experienceTopics).map(([key,item])=><Link key={key} href={'/experiences/'+key} aria-current={key===kind?'page':undefined}>{item.short}</Link>)}</nav>
  <form action={path} className={styles.filters} aria-label="체험 찾기">
   <label>지역<select name="area" defaultValue={area}><option value="">전국</option>{SIDO_LIST.map(sido=><option key={sido}>{sido}</option>)}</select></label>
   {kind==='rural'?<label>체험 종류<select name="theme" defaultValue={theme}><option value="">모든 체험</option>{Object.entries(ruralThemes).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label>:kind==='family'?<label>참가비<select name="cost" defaultValue={cost}><option value="">모든 참가비</option><option value="free">무료로 등록된 활동</option></select></label>:<div/>}
   <label className={styles.search}>프로그램·기관·지역<input type="search" name="q" maxLength={100} defaultValue={q} placeholder={kind==='rural'?'예: 사과, 두부, 가평':kind==='science'?'예: 우주, 만들기, 대전':'예: 공예, 탐방, 가족'}/></label>
   <button type="submit">체험 찾기</button><Link href={path}>검색 조건 초기화</Link>
  </form>
  <p className={styles.count}>{records.length.toLocaleString()}개 {kind==='rural'?'체험마을':'프로그램'}<span>{kind==='rural'?'마을에 등록된 활동입니다. 계절별 운영 여부와 예약은 문의해 주세요.':'활동 일정은 원자료 기준입니다. 접수 상태와 잔여석은 공식 안내를 확인해 주세요.'}</span></p>
  {!shown.length&&<p className={styles.note}>선택한 조건의 체험이 없습니다. 지역이나 검색어를 넓혀 보세요. <Link href={path}>조건 초기화</Link></p>}
  <div className={styles.results}>{shown.map(record=>kind==='rural'?<RuralCard key={record.id} record={record as RuralExperience}/>:kind==='science'?<ScienceCard key={record.id} record={record as ScienceExperience} today={today}/>:<YouthCard key={record.id} record={record as YouthExperience}/>)}</div>
  {pages>1&&<nav className={styles.pagination} aria-label="체험 목록 페이지">{page>1&&<Link href={discoveryPageHref(path,query,page-1)}>이전 체험</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={discoveryPageHref(path,query,page+1)}>다음 체험</Link>}</nav>}
  <aside className={styles.note}>{kind==='rural'?'농어촌 체험은 작황과 계절에 따라 내용이 달라질 수 있습니다. 방문일의 운영 프로그램, 어린이 참여 연령, 최소 예약 인원, 비용·식사·우천 시 운영 기준을 마을에 확인하세요.':'프로그램별 연령·학년, 보호자 동반, 실내·야외 활동, 준비물과 취소 기준을 공식 신청처에서 확인하세요. 교육기간이 남아 있어도 접수는 종료되었을 수 있습니다.'}</aside>
  <p className={styles.source}>자료 확인 {sourceDate(experienceUpdatedAt[kind])}<br/>{kind==='rural'?'출처: 한국농어촌공사·한국어촌어항공단 / 전국농어촌체험휴양마을표준데이터':kind==='family'?'출처: 성평등가족부 청소년 활동정보 방학 중 프로그램 서비스':'출처: 국립중앙과학관·인천학생과학관 공식 교육 일정'}</p>
 </div>;
}
function RuralCard({record:r}:{record:RuralExperience}){return <article id={'experience-'+r.id} className={styles.card}><div className={styles.badges}><span>{r.area} {r.city}</span><span>운영·예약 문의</span></div><h2>{r.title}</h2><p className={styles.summary}>{r.address}</p><h3 className="mb-2 text-sm font-bold">등록된 체험 프로그램</h3><ul className={styles.programs}>{r.programs.slice(0,6).map(program=><li key={program}>{program}</li>)}</ul>{r.programs.length>6&&<details className={styles.more}><summary>체험 {r.programs.length}개 모두 보기</summary><ul className={styles.programs}>{r.programs.slice(6).map(program=><li key={program}>{program}</li>)}</ul></details>}<dl className={styles.facts}><dt>문의</dt><dd>{r.phone||'마을·관리기관 안내 확인'}</dd><dt>관리기관</dt><dd>{r.institution||'원문 확인'}</dd>{r.facilities&&<><dt>시설 안내</dt><dd>{r.facilities}</dd></>}</dl><div className={styles.actions}>{r.homepage&&<a href={r.homepage} target="_blank" rel="noopener noreferrer">체험마을 안내 보기</a>}<a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(r.title+' '+r.address)} target="_blank" rel="noopener noreferrer">지도에서 위치 확인</a></div><p className={styles.source}>원자료 기준일 {r.referenceDate} / <a href={r.source} target="_blank" rel="noopener noreferrer">공공 원자료</a></p></article>;}
function YouthCard({record:r}:{record:YouthExperience}){return <article id={'experience-'+r.id} className={styles.card}><div className={styles.badges}><span>{r.area} {r.city}</span>{r.free&&<span className={styles.free}>참가비 무료</span>}</div><h2>{r.title}</h2><dl className={styles.facts}><dt>활동기간</dt><dd>{r.start} ~ {r.end}</dd><dt>참가대상</dt><dd>{r.audience}</dd><dt>운영기관</dt><dd>{r.institution}</dd><dt>참가비</dt><dd>{/^\d+$/.test(r.price)?Number(r.price).toLocaleString()+'원':r.price}</dd></dl>{r.summary&&<details className={styles.more}><summary>활동 내용과 신청 전 안내</summary><p className={styles.summary}>{r.summary}</p></details>}<div className={styles.actions}><a href={r.officialUrl} target="_blank" rel="noopener noreferrer">e청소년에서 활동명 검색</a></div><p className={styles.source}><a href={r.source} target="_blank" rel="noopener noreferrer">성평등가족부 공공 원자료</a> · 활동별 실제 접수 상태는 운영기관 확인</p></article>;}
function ScienceCard({record:r,today}:{record:ScienceExperience;today:string}){return <article id={'experience-'+r.id} className={styles.card}><div className={styles.badges}><span>{r.area} {r.city}</span><span>{r.registrationEnd&&r.registrationEnd<today?'접수기간 지남':r.sourceStatus}</span></div><h2>{r.title}</h2><dl className={styles.facts}><dt>과학관</dt><dd>{r.institution}</dd><dt>교육일정</dt><dd>{r.period}</dd><dt>참여대상</dt><dd>{r.audience}</dd><dt>신청안내</dt><dd>{r.registration}</dd><dt>비용</dt><dd>{r.price}</dd></dl><div className={styles.actions}><a href={r.officialUrl} target="_blank" rel="noopener noreferrer">공식 교육·예약 안내</a><a href={r.source} target="_blank" rel="noopener noreferrer">과학관 일정 원문</a></div><p className={styles.source}>공식 일정 조회 {sourceDate(r.checkedAt)}<br/>접수기간 내라도 정원 마감일 수 있습니다. 전시 입장과 교육예약 조건을 함께 확인하세요.</p></article>;}
