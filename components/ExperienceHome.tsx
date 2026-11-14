import Link from 'next/link';
import {filterExperiences,experienceRegionHref,experienceTopics} from '@/lib/experienceData';
import ExperienceCard from './ExperienceCard';
import styles from './ExperienceBrowser.module.css';
export default function ExperienceHome(){
 const choices=filterExperiences(undefined),picked=[choices.find(item=>item.kind==='family'),choices.find(item=>item.kind==='science'),...choices.filter(item=>item.kind==='rural').slice(0,2)].filter((item):item is NonNullable<typeof item>=>!!item);
 return <section className={`${styles.page} ${styles.homeSection}`} aria-labelledby="home-public-discovery"><div className={styles.homeHeading}><h2 id="home-public-discovery">지역별 체험·교육</h2><Link href="/experiences">전체 체험 보기</Link></div><nav className={styles.homeLinks} aria-label="체험 분야">{Object.entries(experienceTopics).map(([key,topic])=><Link key={key} href={'/experiences/'+key}>{topic.short}</Link>)}</nav><nav className={styles.homeLinks} aria-label="체험 지역 바로가기">{['서울','경기','인천','강원','충남','전남','경남','제주'].map(area=><Link key={area} href={experienceRegionHref(area)}>{area}</Link>)}<Link href="/experiences">모든 지역</Link></nav><div className={styles.grid}>{picked.map(item=><ExperienceCard key={item.kind+'/'+item.id} item={item} heading="h3"/>)}</div><nav className={styles.homeLinks} aria-label="더 많은 활동"><Link href="/classes">문화·취미 강좌</Link><Link href="/accessible-travel">이동·영유아 편의정보</Link></nav></section>;
}
