// 지역별 숙소 제휴 링크 (세시간전 CPS)
//
// 배너 문구(제목·CTA·안내문)는 여기 등록된 지역명으로 자동 전환됩니다.
//  예) 부산 → "부산 여행, 숙소는 정하셨어요?" / "부산 숙소 최저가 보기"
//
// 지역 전용으로 발급한 링크가 있으면 그 지역 줄만 교체하면 됩니다.
// 나머지는 공통 링크(COMMON)를 사용합니다.
const COMMON = "https://3ha.in/r/629269"; // 지역 전용 링크가 없는 곳에 쓰는 공통 링크

export const STAY_LINKS: Record<string, string> = {
  // ── 지역 전용 발급 링크 ──
  서울: "https://3ha.in/r/628670",
  부산: "https://3ha.in/r/629231",
  대구: "https://3ha.in/r/629242",
  인천: "https://3ha.in/r/629244",
  제주: "https://3ha.in/r/629256",
  // ── 공통 링크 사용(문구만 지역명으로 전환) ──
  경기: COMMON,
  강원: COMMON,
  경북: COMMON,
  경남: COMMON,
  전남: COMMON,
  충남: COMMON,
  전북: COMMON,
  충북: COMMON,
  울산: COMMON,
  대전: COMMON,
  광주: COMMON,
  세종: COMMON,
};

/**
 * 지역명(또는 주소)으로 노출할 숙소 배너 설정을 찾는다.
 * - area가 등록된 지역이면 그대로 사용
 * - area가 없거나 미등록이면 주소 문자열에 지역명이 들어있는지로 보정
 * 등록된 지역이 없으면 null → 배너를 렌더하지 않는다.
 */
export function stayLinkFor(
  area?: string,
  addr?: string
): { region: string; href: string } | null {
  if (area && STAY_LINKS[area]) return { region: area, href: STAY_LINKS[area] };
  const text = addr || "";
  for (const [region, href] of Object.entries(STAY_LINKS)) {
    if (text.includes(region)) return { region, href };
  }
  return null;
}
