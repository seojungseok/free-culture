import Link from 'next/link';
import Image from 'next/image';
import {getGuideTour,type PlaygroundGuide} from '@/lib/playgroundData';
import styles from './Playgrounds.module.css';
export default function PlaygroundCard({guide,heading='h3'}:{guide:PlaygroundGuide;heading?:'h2'|'h3'}){
 const Heading=heading,photo=getGuideTour(guide).photos[0];
 return <article className={styles.card}><Link href={'/playgrounds/'+guide.slug}><div className={styles.cardImage}><Image src={photo.src} alt={photo.alt} fill unoptimized data-license={photo.license} sizes="(max-width:639px) 50vw,(max-width:1023px) 33vw,280px"/><span>{guide.indoor?'실내 · 회차·예약 안내':'야외 공원 가이드'}</span></div><div className={styles.cardBody}><p className={styles.eyebrow}>{guide.area} {guide.district}</p><Heading>{guide.title}</Heading><p className={styles.cardSummary}>{guide.intro}</p><span className={styles.readMore}>놀이터·방문정보 읽기 →</span></div></Link></article>;
}
