import { DOMESTIC_STAY_URL } from '@/lib/stayLinks';
import { AFFILIATE_ENABLED } from '@/lib/affiliate';
import styles from './StayCard.module.css';

/** 기존 호출부를 보존하는 국내 숙소 카드. 외부 요청이나 방문자별 스크립트 없음. */
export default function SeoulStayBanner({ region = '', href = DOMESTIC_STAY_URL, context = 'travel' } = {}) {
  if (!AFFILIATE_ENABLED) return null;
  void region; // 기존 지역별 호출부 호환용: 현재는 하나의 전국 링크를 사용합니다.
  const copy = context === 'pet'
    ? ['함께 떠난 여행, 하루 더 즐기기', '반려동물 동반 조건은 숙소별로 확인해 주세요.']
    : context === 'camping'
    ? ['캠핑 전후, 편하게 쉬어가기', '이동 동선에 맞는 숙소를 골라보세요.']
    : context === 'festival'
    ? ['축제 다음 날까지, 여유 있게', '일정에 맞는 숙소를 둘러보세요.']
    : ['여행을 하루 더 즐길까요?', '일정에 맞는 숙소를 둘러보세요.'];
  return <aside className={styles.card} aria-label="국내 숙소 제휴 안내" data-stay-card>
    <div className={styles.layout}>
      <span className={styles.icon} aria-hidden="true">☾</span>
      <div className={styles.copy}><h2>{copy[0]}</h2><p>{copy[1]}</p></div>
      <div className={styles.action}><a href={href} target="_blank" rel="sponsored noopener noreferrer">숙소 둘러보기 <span aria-hidden="true">→</span></a></div>
    </div>
  </aside>;
}
