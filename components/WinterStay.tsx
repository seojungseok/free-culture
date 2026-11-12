'use client';
import {useEffect,useRef} from 'react';
import {affiliateTrack} from '@/lib/affiliate-track';
import styles from './WinterStay.module.css';
import lodging from '@/data/winter-stay-affiliates.json';

// Preserve the existing operator-issued link. Never manufacture hotel deeplinks
// or infer a room price from a generic promotion.
const stayUrl='https://3ha.in/r/722026';
export default function WinterStay({slug,city,area}:{slug:string;city:string;area:string}){
 const candidate=lodging.stays.find(stay=>stay.slug===slug);
 const node=useRef<HTMLElement>(null),seen=useRef(false),page='/winter-travel/'+slug;
 useEffect(()=>{
  seen.current=false;
  if(!node.current)return;
  const observer=new IntersectionObserver(entries=>{if(seen.current||!entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5))return;seen.current=true;affiliateTrack('affiliate_impression','stay','article_plan',page);observer.disconnect();},{threshold:.5});
  observer.observe(node.current);return()=>observer.disconnect();
 },[page]);
 return <aside id="winter-stay" ref={node} className={styles.wrap} aria-labelledby="winter-stay-title">
  <div className={styles.heading}><span>이 코스에서 1박 한다면</span><h2 id="winter-stay-title">{city}에서 하룻밤, 돌아가는 길은 내일로</h2></div>
  <p className={styles.area}><strong>숙소를 찾아볼 권역</strong><span>{area}</span></p>
  <ul><li>첫날 마지막 장소에서 숙소까지의 이동</li><li>난방·주차·침구와 추가 인원 요금</li><li>예약 날짜의 총 숙박료와 취소 가능 시점</li></ul>
  {candidate&&<p className={styles.property}><span>함께 살펴볼 {city} 숙소</span><strong>{candidate.name}</strong></p>}
  <a href={candidate?.affiliateUrl||stayUrl} target="_blank" rel="sponsored noopener noreferrer" data-affiliate-provider="stay" data-affiliate-placement="article_plan" onClick={()=>affiliateTrack('affiliate_click','stay','article_plan',page)}>숙소 예약하러 가기 <span aria-hidden="true">↗</span></a>
  <p className={styles.note}>{candidate?'해당 숙소 예약 화면에서 날짜·인원을 선택하세요. 위치와 총 요금·객실 조건을 비교한 뒤 예약할 수 있습니다.':'연결된 숙소 기획전에서 지역·날짜·인원을 선택하세요. 요금과 객실은 예약 화면에서 확인할 수 있습니다.'}</p>
  <p className={styles.disclosure}>[광고] 세시간전 제휴 링크를 통한 예약 시 수수료를 지급받습니다.</p>
 </aside>;
}
