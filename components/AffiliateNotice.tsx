/**
 * 제휴 링크 고지 — 공정위 「추천·보증 등에 관한 표시·광고 심사지침」
 * 소비자가 쉽게 인식할 수 있도록 **본문 시작 부분**(제목 바로 아래)에 배치한다.
 * 제휴 링크(숙소·쿠팡 배너)가 실제로 들어가는 페이지에서만 렌더할 것.
 *
 * partner="coupang" — 쿠팡 파트너스는 "쿠팡 파트너스 활동의 일환" 표현을 요구하므로
 * 이 문구를 상단 고지에 포함시키고, 배너 하단 문구는 중복이라 두지 않는다.
 */
export default function AffiliateNotice({
  className = "",
  partner,
}: {
  className?: string;
  partner?: "coupang";
}) {
  const text =
    partner === "coupang"
      ? "이 글에는 제휴 링크가 포함되어 있습니다. 쿠팡 파트너스 활동의 일환으로 이에 따른 일정액의 수수료를 제공받습니다."
      : "이 글에는 제휴 링크가 포함되어 있으며, 이를 통해 소정의 수수료를 제공받습니다.";
  return <p className={`text-[11.5px] leading-[1.5] text-ink-faint ${className}`}>{text}</p>;
}
