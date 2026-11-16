import Link from 'next/link';
import Image from 'next/image';
import {getGuideTour,type PlaygroundGuide} from '@/lib/playgroundData';
import styles from './ExperienceBrowser.module.css';
import playgroundStyles from './Playgrounds.module.css';
export default function PlaygroundCard({guide,heading='h3'}:{guide:PlaygroundGuide;heading?:'h2'|'h3'}){
 const Heading=heading,photo=getGuideTour(guide).photos[0];
 return <article className={`${styles.card} ${playgroundStyles.guideCard}`} data-playground-guide data-area={guide.area} data-indoor={guide.indoor} data-fee={guide.visit.feeKind}>
  <Link href={'/playgrounds/'+guide.slug} className={styles.cardLink} prefetch={false}>
   <div className={`${styles.cardImage} ${playgroundStyles.guidePhoto}`}><Image src={photo.src} alt={photo.alt} fill unoptimized data-license={photo.license} sizes="(max-width:639px) 50vw,(max-width:1023px) 33vw,280px"/><span className={styles.cardTopic}>{guide.indoor?'실내 놀이터':'공원·야외 놀이터'}</span><span className={guide.visit.feeKind==='free'?styles.free:playgroundStyles.paidBadge}>{guide.visit.fee}</span></div>
   <div className={styles.cardBody}><p className={styles.cardRegion}>{guide.area} {guide.district}</p><Heading>{guide.title}</Heading><p className={`${styles.cardPeriod} ${playgroundStyles.cardHours}`}>{guide.visit.hours}</p><p className={`${styles.cardInstitution} ${playgroundStyles.cardConditions}`}>{guide.indoor?guide.visit.age:guide.visit.parking}</p><span className={styles.cardDetail}>이용안내 · 상세 보기</span></div>
  </Link>
 </article>;
}
