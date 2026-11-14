import Image from 'next/image';
import Link from 'next/link';
import {experienceHref,experienceTopics,experienceStatus,type Experience} from '@/lib/experienceData';
import styles from './ExperienceBrowser.module.css';
export function ExperienceArtwork({item}:{item:Pick<Experience,'kind'|'title'>}){
 return <div className={`${styles.artwork} ${styles[item.kind]}`} aria-label="프로그램 안내 이미지"><svg viewBox="0 0 240 150" aria-hidden="true"><circle cx="187" cy="35" r="28"/><path d={item.kind==='rural'?'M25 127 Q65 40 116 113 Q169 50 221 127 M119 116 V50 M119 77 Q75 75 83 43 Q121 39 119 77 M121 64 Q161 65 166 32 Q124 26 121 64':item.kind==='science'?'M71 119 H171 M91 119 Q77 93 99 73 M104 81 L145 30 L167 49 L126 101 Z M149 30 L158 19 L177 36 L167 49 M135 104 Q169 108 167 119':'M56 121 L111 34 L132 45 L77 132 Z M117 43 L135 20 L154 32 L136 57 M100 121 H195 V63 H159 M164 74 H189 M164 89 H189 M164 104 H189'}/></svg><span>{experienceTopics[item.kind].short}</span><small>안내 이미지</small></div>;
}
export default function ExperienceCard({item,priority=false,heading='h2'}:{item:Experience;priority?:boolean;heading?:'h2'|'h3'}){
 const Heading=heading;
 return <article className={styles.card} data-experience-card data-kind={item.kind} data-area={item.area}>
  <Link href={experienceHref(item)} className={styles.cardLink} prefetch={false}>
   <div className={styles.cardImage}>{item.image?<Image src={item.image.src} alt={item.imageAlt} fill sizes="(max-width:640px) 50vw,(max-width:1000px) 33vw,260px" priority={priority} unoptimized/>:<ExperienceArtwork item={item}/>}<span className={styles.cardTopic}>{experienceTopics[item.kind].short}</span>{item.free&&<span className={styles.free}>참가비 무료</span>}</div>
   <div className={styles.cardBody}><p className={styles.cardRegion}>{item.area} {item.city}</p><Heading>{item.title}</Heading><p className={styles.cardPeriod}>{item.kind==='rural'?item.programs.slice(0,3).join(' · '):item.period||`${item.start} ~ ${item.end}`}</p><p className={styles.cardInstitution}>{item.institution}</p><span className={styles.cardDetail}>{item.kind==='rural'?'체험 내용 보기':experienceStatus(item)+' · 상세 보기'}</span></div>
  </Link>
 </article>;
}
