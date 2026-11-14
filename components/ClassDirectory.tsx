import Link from 'next/link';
import {SIDO_LIST} from '@/lib/classify';
import {LEARNING_SOURCE,registrationState} from '@/lib/learning.mjs';
import {classCollections,currentClasses,discoveryPageHref,learningUpdatedAt,queryValue,sourceDate,todayIso,publicClassHref,type ClassCollection,type DiscoveryQuery} from '@/lib/publicDiscovery';
import styles from './PublicDiscovery.module.css';
import PublicDiscoverySchema from './PublicDiscoverySchema';

export default function ClassDirectory({collection='all',query={}}:{collection?:ClassCollection;query?:DiscoveryQuery}){
 const info=classCollections[collection],today=todayIso(),courses=currentClasses(collection,query,today),size=24;
 const pages=Math.max(1,Math.ceil(courses.length/size)),page=Math.min(pages,Math.max(1,Math.floor(Number(queryValue(query,'page'))||1))),shown=courses.slice((page-1)*size,page*size);
 return <div className={styles.page}>
  <PublicDiscoverySchema title={info.title} path={info.href} items={shown.map(course=>({name:course.title,url:publicClassHref(course)}))}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/classes">문화·취미 강좌</Link>{collection!=='all'&&<><span>/</span><span>{info.title}</span></>}</nav>
  <header className={styles.hero}><h1>{info.title}</h1><p>{info.description}</p></header>
  <nav className={styles.tabs} aria-label="강좌 주제">{Object.entries(classCollections).map(([key,item])=><Link href={item.href} key={key} aria-current={key===collection?'page':undefined}>{({all:'전체 강좌',free:'수강료 0원',weekend:'주말 운영',family:'아이·가족'})[key]}</Link>)}</nav>
  <form action={info.href} className={styles.filters} aria-label="강좌 찾기">
   <label>지역<select name="area" defaultValue={queryValue(query,'area')}><option value="">전국</option>{SIDO_LIST.map(area=><option key={area}>{area}</option>)}</select></label>
   <label>수강료<select name="cost" defaultValue={queryValue(query,'cost')}><option value="">전체 금액</option><option value="free">수강료 0원</option></select></label>
   <label>운영요일<select name="day" defaultValue={queryValue(query,'day')}><option value="">전체 요일</option><option value="weekend">토·일 운영</option></select></label>
   <label>교육대상<select name="audience" defaultValue={queryValue(query,'audience')}><option value="">모든 대상</option><option value="family">아이·가족 대상</option></select></label>
   <label className={styles.search}>강좌명·지역·기관<input type="search" name="q" maxLength={100} defaultValue={queryValue(query,'q')} placeholder="예: 도자기, 그림책, 수원"/></label>
   <label>접수기간<select name="status" defaultValue={queryValue(query,'status')}><option value="">접수기간 내·접수예정</option><option value="all">접수 종료·일정 미상도 보기</option></select></label>
   <button type="submit">강좌 찾기</button>
  </form>
  <p className={styles.count}>{courses.length.toLocaleString()}개 강좌<span>접수일은 공공자료 기준입니다. 잔여석·실제 접수 가능 여부는 운영기관에서 확인해 주세요.</span></p>
  {!shown.length&&<div className={styles.note}>선택한 조건의 강좌가 없습니다. 지역이나 운영요일 조건을 넓히거나 접수기간 설정을 바꿔 보세요. <Link href={info.href}>검색 조건 초기화</Link></div>}
  <div className={styles.results}>{shown.map(course=><article key={course.id} id={'class-'+course.id} className={styles.card}>
   <div className={styles.badges}><span>{course.area}</span><span>{registrationState(course,today)}</span><span className={course.tuition===0?styles.free:undefined}>{course.tuition===0?'수강료 0원':course.tuition===null?'수강료 확인':course.tuition.toLocaleString()+'원'}</span></div>
   <h2><Link href={publicClassHref(course)}>{course.title}</Link></h2><p className={styles.summary}>{course.description}</p>
   <dl className={styles.facts}><dt>교육기간</dt><dd>{course.start} ~ {course.end}</dd><dt>요일·시간</dt><dd>{course.weekdays||'요일 확인'} {course.startTime}{course.endTime?' ~ '+course.endTime:''}</dd><dt>대상</dt><dd>{course.audience||'운영기관 확인'}</dd><dt>장소</dt><dd>{course.venue}</dd><dt>접수기간</dt><dd>{course.registrationStart||'시작일 확인'} ~ {course.registrationEnd||'종료일 확인'}</dd></dl>
   <details className={styles.more}><summary>신청 전 상세 안내</summary><dl className={styles.facts}><dt>운영기관</dt><dd>{course.institution}</dd><dt>주소</dt><dd>{course.address||'운영기관 확인'}</dd><dt>교육방식</dt><dd>{course.method||'확인 필요'}</dd><dt>접수방법</dt><dd>{course.registrationMethod||'운영기관 확인'}</dd><dt>선정방법</dt><dd>{course.selection||'운영기관 확인'}</dd><dt>정원</dt><dd>{course.capacity?course.capacity+'명 (잔여석 수가 아닙니다)':'확인 필요'}</dd><dt>문의</dt><dd>{course.phone||'운영기관 안내 확인'}</dd></dl><p className={styles.summary}>수강료와 별도로 재료비·교재비가 들 수 있습니다. 거주지·연령 제한, 실제 모집 상태와 준비물은 기관 안내를 확인해 주세요.</p></details>
   <div className={styles.actions}><Link href={publicClassHref(course)}>강좌 내용·신청 안내 보기</Link></div>
   <p className={styles.source}>원자료 기준일 {course.referenceDate}<br/>출처: 지방자치단체·교육청 / <a href={LEARNING_SOURCE} target="_blank" rel="noopener noreferrer">전국평생학습강좌표준데이터</a></p>
  </article>)}</div>
  {pages>1&&<nav className={styles.pagination} aria-label="강좌 목록 페이지">{page>1&&<Link href={discoveryPageHref(info.href,query,page-1)}>이전 강좌</Link>}<span>{page} / {pages}</span>{page<pages&&<Link href={discoveryPageHref(info.href,query,page+1)}>다음 강좌</Link>}</nav>}
  <aside className={styles.note}>강좌명, 교육대상, 운영요일에 표시된 조건으로 분류합니다. 공공자료에는 기관별 등록 시차가 있어 접수 마감·취소가 즉시 반영되지 않을 수 있습니다. 운영기관 안내에서 최종 확인한 뒤 신청해 주세요.</aside>
  <p className={styles.source}>자료 수집 확인 {sourceDate(learningUpdatedAt)} · 매일 새 자료 확인<br/><Link href="/accessible-travel">이동·영유아 편의정보로 나들이 찾기</Link> / <Link href="/weekend">이번 주말 문화행사</Link></p>
 </div>;
}
