/**
 * 제휴 링크 고지 — 공정위 「추천·보증 등에 관한 표시·광고 심사지침」
 * 소비자가 쉽게 인식할 수 있도록 **본문 시작 부분**(제목 바로 아래)에 배치한다.
 * 제휴 링크(숙소·쿠팡 배너)가 실제로 들어가는 페이지에서만 렌더할 것.
 */
export default function AffiliateNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11.5px] leading-[1.5] text-ink-faint ${className}`}>
      이 글에는 제휴 링크가 포함되어 있으며, 이를 통해 소정의 수수료를 제공받습니다.
    </p>
  );
}
