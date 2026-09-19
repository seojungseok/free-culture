import { DOMESTIC_STAY_URL } from '@/lib/stayLinks';
import styles from './StayCard.module.css';

/** 기존 호출부를 보존하는 국내 숙소 카드. 외부 요청이나 방문자별 스크립트 없음. */
export default function SeoulStayBanner({ region = '', href = DOMESTIC_STAY_URL, context = 'travel' } = {}) {
  const copy = context === 'pet'
    ? ['함께 떠난 여행, 하룻밤도 함께', '숙소를 고를 때 반려동물 동반 객실인지, 몸무게 제한과 추가 요금은 어떤지 먼저 확인해 보세요.']
    : context === 'camping'
    ? ['캠핑 앞뒤로 하루 더 쉬어갈까요?', '먼 길을 이동하거나 캠핑 대신 실내 숙박을 고민한다면, 여행 동선에 맞는 호텔·리조트를 살펴보세요.']
    : context === 'festival'
    ? ['축제의 여운, 하룻밤 더 이어가요', '귀가를 서두르기 아쉽다면 숙소를 정하고 다음 날 나들이까지 이어보세요. 행사장과의 거리도 함께 확인하세요.']
    : ['돌아가기 아쉽다면, 하루 더 머물러요', '하루에 모두 담기 아쉬운 여행. 호텔·리조트를 살펴보고 내일의 산책까지 여유롭게 계획해 보세요.'];
  return <aside className={styles.card} aria-label="국내 숙소 제휴 안내" data-stay-card>
    <div className={styles.top}><span>여행에 쉼표 하나</span><span className={styles.ad}>제휴 광고</span></div>
    <div className={styles.layout}>
      <div className={styles.copy}><h2>{copy[0]}</h2><p>{copy[1]}</p><ul><li>여행 동선</li><li>숙박 날짜·인원</li><li>{context === 'pet' ? '동반 조건 확인' : '취소 조건 확인'}</li></ul></div>
      <div className={styles.action}><a href={href} target="_blank" rel="sponsored noopener noreferrer">내 여행에 맞는 숙소 찾기 <span aria-hidden="true">↗</span></a><p>전국 숙소 기획전으로 이동합니다. 여행 지역을 고르고 객실별 날짜·인원을 확인해 주세요.</p></div>
    </div>
    <p className={styles.notice}>이 링크를 통한 예약 시 일정액의 수수료를 제공받을 수 있습니다. 요금·예약 가능 여부와 이용 조건은 예약 페이지에서 확인해 주세요.</p>
  </aside>;
}
