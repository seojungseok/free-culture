import Link from 'next/link';
import {getRecommendedPlaygroundGuides,playgroundBrowseHref,playgroundAreas} from '@/lib/playgroundData';
import PlaygroundCard from './PlaygroundCard';
import styles from './ExperienceBrowser.module.css';
export default function PlaygroundHome(){
 const guides=getRecommendedPlaygroundGuides().slice(0,4);
 if(!guides.length)return null;
 return <section className={`${styles.page} ${styles.homeSection}`} aria-labelledby="home-playgrounds">
  <div className={styles.homeHeading}><h2 id="home-playgrounds">지역별 어린이 놀이터</h2><Link href="/playgrounds">전체 놀이터 보기</Link></div>
  <nav className={styles.homeLinks} aria-label="놀이터 분야"><Link href={playgroundBrowseHref('','indoor')}>실내 놀이터</Link><Link href={playgroundBrowseHref('','free')}>무료 놀이터</Link><Link href={playgroundBrowseHref('','outdoor')}>공원·야외 놀이터</Link></nav>
  <nav className={styles.homeLinks} aria-label="놀이터 지역 바로가기">{playgroundAreas.map(area=><Link key={area} href={playgroundBrowseHref(area)}>{area}</Link>)}<Link href="/playgrounds">모든 지역</Link></nav>
  <div className={`${styles.grid} ${styles.homeGrid}`} data-home-playground-cards>{guides.map(g=><PlaygroundCard key={g.slug} guide={g}/>)}</div>
 </section>;
}
