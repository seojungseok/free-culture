import Image from 'next/image';
import Link from 'next/link';
import {experienceTopics,experienceRegionHref,experienceStatus,relatedExperiences,type Experience} from '@/lib/experienceData';
import {experienceStructuredData} from '@/lib/experienceSeo';
import {sourceDate} from '@/lib/publicDiscovery';
import ExperienceCard from './ExperienceCard';
import styles from './ExperienceBrowser.module.css';
function Facts({rows}:{rows:[string,string][]}){return <dl className={styles.facts}>{rows.filter(([,value])=>value).map(([label,value])=><div key={label} style={{display:'contents'}}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;}
export default function ExperienceDetail({item}:{item:Experience}){
 const status=experienceStatus(item),period=item.period||(item.start?`${item.start} ~ ${item.end}`:''),phone=item.phone.replace(/[^\d+]/g,'');
 const bookingLabel=item.kind==='rural'?'마을 홈페이지에서 예약·문의':item.kind==='science'?'공식 교육 신청·예약':'e청소년에서 신청처 확인';
 return <article className={styles.page} data-experience-detail>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(experienceStructuredData(item)).replace(/</g,'\\u003c')}}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/experiences">체험·교육</Link><span>/</span><Link href={'/experiences/'+item.kind}>{experienceTopics[item.kind].short}</Link><span>/</span><span>{item.title}</span></nav>
  <header className={styles.detailHeader}><p>{item.area} {item.city} · {experienceTopics[item.kind].short}</p><h1>{item.title}</h1><p className={styles.summary}>{item.summary}</p><nav className={styles.detailJump} aria-label="체험 상세 바로가기"><a href="#experience-programs">체험 내용</a><a href="#experience-location">위치·문의</a><a href="#experience-apply">신청·예약 안내</a></nav></header>
  <div className={styles.detailGrid}>
   <div className={styles.detailMain}>
    {item.image&&<figure className={`${styles.detailPhoto} ${item.imageKind==='poster'?styles.programmePhoto:''}`}><Image src={item.image.src} alt={item.imageAlt} width={item.image.width} height={item.image.height} priority unoptimized/><figcaption>{item.imageAlt}{item.imageSourcePage&&<> · <a href={item.imageSourcePage} target="_blank" rel="noopener noreferrer">공식 게시물</a></>}</figcaption></figure>}
    {item.kind==='rural'?<section className={styles.detailSection} id="experience-programs"><h2>이 마을에서 할 수 있는 체험</h2><ul>{item.programs.map(program=><li key={program}>{program}</li>)}</ul><p>공공자료에 등록된 체험입니다. 수확 시기와 작황에 따라 진행하는 프로그램이 달라질 수 있습니다.</p></section>:<>
     <section className={styles.detailSection} id="experience-programs"><h2>{item.kind==='science'?'교육 내용':'활동 안내'}</h2>{(item.content.length?item.content:[`${item.title}은(는) ${item.institution}에서 안내하는 ${item.audience} 대상 프로그램입니다.`,`${period} 일정으로 등록되어 있습니다.`]).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</section>
     {!!item.activities.length&&<section className={styles.detailSection}><h2>무엇을 하나요?</h2>{item.activities.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</section>}
    </>}
    {item.venueOverview&&<section className={styles.detailSection}><h2>{item.kind==='science'?'과학관 둘러보기':'체험마을 소개'}</h2><p>{item.venueOverview}</p><p className={styles.bookingNote}>한국관광공사 장소 소개 · {sourceDate(item.venueCheckedAt||item.checkedAt)} 확인. 프로그램별 운영 안내와 별도로 제공되는 장소 정보입니다.</p></section>}
    <section className={styles.detailSection}><h2>{item.kind==='rural'?'체험·시설 안내':'일정·비용·참여대상'}</h2><Facts rows={[
     ['활동 일정',period],['참여 대상',item.audience],['참가비',item.kind==='rural'?'체험별 비용은 공개자료에 미기재':item.price||'공개자료에 미기재'],['접수 안내',item.registration],['보유 시설',item.facilities],['운영·관리',item.institution],['자료 기준일',item.referenceDate]
    ]}/></section>
    <section className={styles.detailSection} id="experience-location"><h2>위치와 문의처</h2><Facts rows={[
     ['활동 기관',item.institution],['주소',item.address||`${item.area} ${item.city}`],['문의 전화',item.phone]
    ]}/>{item.address&&<a className={styles.mapLink} href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(item.address+' '+(item.kind==='science'?item.institution:item.title))} target="_blank" rel="noopener noreferrer">지도에서 위치 확인 (새 창)</a>}</section>
   </div>
   <aside className={styles.sidebar} id="experience-apply" aria-label="신청·예약 안내"><span className={styles.status}>{status}</span><h2>{item.kind==='rural'?'방문·체험 예약':'참여·신청 안내'}</h2><Facts rows={[
    ['지역',`${item.area} ${item.city}`],['활동 일정',period],['대상',item.audience],['비용',item.free?'참가비 무료':item.price||'체험별 문의'],['신청 기간',item.registration]
   ]}/>{item.officialUrl&&<a className={styles.booking} href={item.officialUrl} target="_blank" rel="noopener noreferrer" data-external-application>{bookingLabel} ↗</a>}{phone&&<a className={styles.phone} href={'tel:'+phone}>전화 문의 · {item.phone}</a>}<p className={styles.bookingNote}>{item.kind==='rural'?'체험 운영일, 어린이 참여 연령, 최소 인원과 예약 가능 여부를 마을에 확인하세요.':item.kind==='science'?'접수기간 안이라도 정원 마감일 수 있습니다. 전시 입장과 별도 교육예약 조건을 확인하세요.':'활동명과 기관명을 확인해 신청하세요. API의 활동 일정과 실제 접수기간은 다를 수 있습니다.'}</p><Link className={styles.mapLink} href={experienceRegionHref(item.area)}>{item.area}의 다른 체험 보기</Link></aside>
  </div>
  <div className={styles.source}><p>목록 확인 {sourceDate(item.checkedAt)}{item.detailCheckedAt?` · 상세자료 확인 ${sourceDate(item.detailCheckedAt)}`:''}</p><p>출처: <a href={item.source} target="_blank" rel="noopener noreferrer" data-source-link>{item.kind==='rural'?'한국농어촌공사·한국어촌어항공단 농어촌 체험마을 API':item.kind==='family'?'성평등가족부 청소년 프로그램 목록·상세 API':'과학관 공식 교육 일정'}</a>{item.venueOverview&&<> · <a href={item.venueSource} target="_blank" rel="noopener noreferrer" data-source-link>한국관광공사 장소 소개</a></>}</p></div>
  <section className={styles.related}><h2>함께 살펴볼 체험</h2><div className={styles.grid}>{relatedExperiences(item).map(other=><ExperienceCard key={other.kind+'/'+other.id} item={other} heading="h3"/>)}</div><nav className={styles.areaLinks}><Link href={experienceRegionHref(item.area)}>{item.area} 체험 전체</Link><Link href={'/experiences/'+item.kind}>{experienceTopics[item.kind].short} 전체</Link><Link href="/experiences">전국 체험·교육</Link></nav></section>
 </article>;
}
