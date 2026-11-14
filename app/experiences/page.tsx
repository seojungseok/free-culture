import type {Metadata} from 'next';
import Link from 'next/link';
import {experienceTopics,ruralExperiences,youthExperiences,scienceExperiences} from '@/lib/experienceData';
import PublicDiscoverySchema from '@/components/PublicDiscoverySchema';
import styles from '@/components/PublicDiscovery.module.css';
export const revalidate=3600;
export const metadata:Metadata={title:'직접 해보는 주말 체험 — 가족·과학관·농촌 체험',description:'어린이·청소년 체험, 과학관 실험·교육, 농촌·어촌 수확·만들기 프로그램을 찾아보세요. 활동 내용과 대상, 일정, 공식 신청 안내를 확인할 수 있습니다.',alternates:{canonical:'/experiences'}};
export default function ExperienceHub(){
 const topics=[{kind:'family' as const,icon:'🎨',count:youthExperiences().length,example:'공예·문화·탐방 활동',guide:'참가 연령과 보호자 동반, 접수 방법을 먼저 확인하세요.'},{kind:'science' as const,icon:'🔬',count:scienceExperiences().length,example:'실험·우주·생태 프로그램',guide:'전시 관람과 별도 교육예약을 구분해 보세요.'},{kind:'rural' as const,icon:'🌱',count:ruralExperiences().length,example:'수확·음식·만들기 체험',guide:'수확철과 체험 운영일, 최소 인원을 마을에 문의하세요.'}];
 return <div className={styles.page}>
  <PublicDiscoverySchema title="직접 해보는 주말 체험" path="/experiences" items={topics.map(topic=>({name:experienceTopics[topic.kind].short,url:'/experiences/'+topic.kind}))}/>
  <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><span>주말 체험</span></nav>
  <header className={styles.hero}><h1>직접 해보는 주말 체험</h1><p>보고 오는 하루에 새로운 경험을 더해보세요. 아이와 만드는 공예, 과학관의 실험 교실, 마을에서 함께하는 수확 체험을 골라볼 수 있습니다.</p></header>
  <div className={styles.experienceGrid}>{topics.map(topic=><section key={topic.kind} className={styles.topic}><span className={styles.topicIcon} aria-hidden="true">{topic.icon}</span><h2>{experienceTopics[topic.kind].short}</h2><p>{topic.example}</p><p className={styles.summary}>{topic.guide}</p><Link href={'/experiences/'+topic.kind}>{topic.count.toLocaleString()}개 {topic.kind==='rural'?'마을':'프로그램'} 살펴보기</Link></section>)}</div>
  <section className={styles.note}><h2 className="mb-2 text-lg font-bold">체험을 고를 때 확인할 세 가지</h2><ol className="list-decimal space-y-2 pl-5"><li>연령·학년과 동반 인원: 아이만 참여하는 교육인지 보호자도 함께 예약하는지 확인합니다.</li><li>운영일과 접수일: 행사 기간과 신청 기간이 다를 수 있습니다. 남은 자리는 공식 신청처에서 확인합니다.</li><li>비용과 준비물: 참가비에 재료비·보험·식사 등이 포함되는지, 야외 체험의 우천 기준은 무엇인지 확인합니다.</li></ol></section>
  <div className={styles.actions}><Link href="/classes">문화·취미 강좌도 찾아보기</Link><Link href="/accessible-travel">이동·영유아 편의정보 확인</Link></div>
 </div>;
}
