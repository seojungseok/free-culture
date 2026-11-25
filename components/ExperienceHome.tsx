import Link from 'next/link';
import {filterExperiences} from '@/lib/experienceData';
import ExperienceCard from './ExperienceCard';
import styles from './ExperienceBrowser.module.css';

export default function ExperienceHome() {
  const items = filterExperiences(undefined).slice(0, 4);
  return <section className={[styles.page, styles.homeSection].join(' ')} aria-labelledby="home-public-discovery">
    <div className={styles.homeHeading}>
      <h2 id="home-public-discovery">지역별 체험·교육</h2>
      <Link href="/experiences" aria-label="지역별 체험·교육 더보기">더보기 <span aria-hidden="true">›</span></Link>
    </div>
    {items.length > 0 ? <div className={[styles.grid, styles.homeGrid].join(' ')} data-home-experience-cards>
      {items.map(item => <ExperienceCard key={item.kind + item.id} item={item} heading="h3"/>)}
    </div> : <p>현재 접수를 확인한 체험이 없습니다. <Link href="/weekend">이번 주말 행사 보기 →</Link></p>}
  </section>;
}
