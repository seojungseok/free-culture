import Link from 'next/link';
import Image from 'next/image';
import {SITE} from '@/lib/site';
import {sourceDate} from '@/lib/publicDiscovery';
import {experienceIntro} from '@/lib/experienceText.mjs';
import ProgrammeContent,{ProgrammeFacts as FactList} from './ProgrammeContent';
import styles from './ExperienceBrowser.module.css';
import ProgrammeCover from './ProgrammeCover';
import ProgrammeSessions,{type Session} from './ProgrammeSessions';
import type {ProgrammeCoverData} from '@/lib/programmeMedia';
type Section={title:string;paragraphs?:string[];facts?:[string,string][]};
type Props={title:string;description:string;path:string;category:string;categoryHref:string;area:string;status:string;sections:Section[];bookingFacts:[string,string][];officialUrl?:string;phone?:string;source:string;sourceLabel:string;checkedAt:string;image?:{src:string;width:number;height:number};schema?:Record<string,unknown>;cover?:ProgrammeCoverData;sessions?:Session[];canApply?:boolean;notice?:string};
export default function PublicProgramDetail(p:Props){
 const url=new URL(p.path,SITE.url).href,phone=(p.phone||'').replace(/[^\d+]/g,'');
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url,url,name:p.title,description:p.description,inLanguage:'ko-KR',...(p.schema?{mainEntity:p.schema}:{})},
  {'@type':'BreadcrumbList',itemListElement:[{name:'홈',item:SITE.url},{name:p.category,item:new URL(p.categoryHref,SITE.url).href},{name:p.title,item:url}].map((entry,index)=>({'@type':'ListItem',position:index+1,...entry}))}
 ]};
 return <article className={styles.page} data-public-program-detail>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href={p.categoryHref}>{p.category}</Link><span>/</span><span>{p.title}</span></nav>
  <header className={styles.detailHeader}><p>{p.area} · {p.category}</p><h1>{p.title}</h1><p className={styles.summary}>{experienceIntro([p.description])}</p><nav className={styles.detailJump} aria-label="상세 내용 바로가기">{p.sections.map((section,index)=><a href={'#programme-section-'+index} key={section.title}>{section.title}</a>)}<a href="#programme-apply">신청·이용 안내</a></nav></header>
  {p.notice&&<div className={styles.availabilityNotice} role="status"><strong>{p.status}</strong><p>{p.notice}</p><Link href={p.categoryHref}>현재 접수 중인 강좌 보기</Link></div>}
  <div className={`${styles.detailGrid} ${!p.image&&!p.cover?styles.noPhoto:''}`}>
   {p.cover&&<figure className={styles.detailPhoto}><ProgrammeCover cover={p.cover} detail priority/></figure>}
   {!p.cover&&p.image&&<figure className={styles.detailPhoto}><div className={styles.photoFrame}><Image src={p.image.src} width={p.image.width} height={p.image.height} alt={p.title+' 전경 (공공기관 제공)'} priority unoptimized/></div></figure>}
   <aside className={styles.sidebar} id="programme-apply" aria-label="신청·이용 안내"><span className={styles.status}>{p.status}</span><h2>{p.canApply===false?'모집 상태 안내':'신청·이용 안내'}</h2><FactList rows={p.bookingFacts}/>{p.canApply!==false&&p.officialUrl&&<a href={p.officialUrl} className={styles.booking} target="_blank" rel="noopener noreferrer" data-external-application>공식 기관의 신청·이용 안내 ↗</a>}{phone&&<a href={'tel:'+phone} className={styles.phone}>전화 문의 · {p.phone}</a>}<Link href={p.categoryHref} className={styles.mapLink}>{p.category} 목록으로</Link></aside>
   <div className={styles.detailMain}><ProgrammeSessions sessions={p.sessions}/>{p.sections.map((section,index)=><section key={section.title} id={'programme-section-'+index} className={styles.detailSection}><h2>{section.title}</h2>{section.paragraphs&&<ProgrammeContent lines={section.paragraphs}/>} {section.facts&&<FactList rows={section.facts}/>}</section>)}</div>
  </div>
  <div className={styles.source}><p>자료 확인 {sourceDate(p.checkedAt)}</p><p>출처: <a href={p.source} target="_blank" rel="noopener noreferrer" data-source-link>{p.sourceLabel}</a></p></div><nav className={styles.areaLinks}><Link href={p.categoryHref}>{p.category} 전체</Link><Link href="/experiences">지역별 체험·교육</Link></nav>
 </article>;
}
