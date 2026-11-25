import Link from 'next/link';
import {getRecommendedPlaygroundGuides} from '@/lib/playgroundData';
import PlaygroundCard from './PlaygroundCard';
import styles from './ExperienceBrowser.module.css';

export default function PlaygroundHome() {
  const items = getRecommendedPlaygroundGuides().slice(0, 4);
  return <section className={[styles.page, styles.homeSection].join(' ')} aria-labelledby="home-playgrounds">
    <div className={styles.homeHeading}>
      <h2 id="home-playgrounds">지역별 어린이 놀이터</h2>
      <Link href="/playgrounds" aria-label="지역별 어린이 놀이터 더보기">더보기 <span aria-hidden="true">›</span></Link>
    </div>
    {items.length > 0 ? <div className={[styles.grid, styles.homeGrid].join(' ')} data-home-playground-cards>
      {items.map(item => <PlaygroundCard key={item.slug} guide={item}/>)}
    </div> : <p>이번 주말 운영을 확인한 놀이터가 없습니다. <Link href="/kids">아이와 갈 만한 곳 보기 →</Link></p>}
  </section>;
}
