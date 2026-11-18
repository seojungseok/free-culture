import Link from 'next/link';
import {getPublicWinterCourses} from '@/lib/winterCourses';
import {winterCourseImage} from '@/lib/winterCourseImage.mjs';
import styles from './HomeExplorer.module.css';

export default function HomeWinterCourses() {
  const courses = getPublicWinterCourses();
  if (!courses.length) return null;
  const featured = ['서울', '강원', '부산', '경기'].flatMap((area, index) => {
    const options = courses.filter(course => course.area === area);
    const pick = options.find(course => course.duration === (index % 2 ? '당일' : '1박2일')) || options[0];
    return pick ? [pick] : [];
  });
  const preview = [...featured, ...courses.filter(course => !featured.includes(course))].slice(0, 4);

  return <section className={styles.winterSection} aria-labelledby="home-winter-title">
    <div className={styles.sectionHeading}>
      <h2 id="home-winter-title">겨울여행 <span className={styles.courseCount}>{courses.length}코스</span></h2>
      <Link href="/winter-travel" aria-label="겨울여행 코스 더보기" className={styles.moreLink}>더보기 <span aria-hidden="true">›</span></Link>
    </div>
    <div className={styles.winterGrid} data-home-winter-cards>{preview.map(course => {
      const image = winterCourseImage(course);
      return <article key={course.slug} className={[styles.card, styles.winterCard].join(' ')}>
        <Link href={'/winter-travel/' + course.slug} prefetch={false} className={styles.cardLink}>
          <div className={styles.cardImage}>
            {image && <img src={image.src} alt={image.alt || course.title} width={640} height={400} loading="lazy" decoding="async"/>}
            <span className={styles.locationBadge}>{[course.area, course.city, course.duration === '당일' ? '당일치기' : '1박 2일'].filter(Boolean).join(' · ')}</span>
          </div>
          <div className={styles.cardBody}><h3>{course.title}</h3><p className={styles.route}>{course.stops.map(stop => stop.name).join(' → ')}</p></div>
        </Link>
      </article>;
    })}</div>
  </section>;
}
