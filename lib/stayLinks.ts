// 지역별 숙소 제휴 링크 (세시간전 CPS) — 발급받은 지역만 여기에 추가하면 자동 노출됩니다.
//
// ⚠️ 반드시 세시간전 대시보드에서 "그 지역으로" 발급한 URL만 넣으세요.
//    서울 링크를 부산 페이지에 쓰면 맥락이 어긋나고 정책 위반 소지가 있습니다.
//
// 추가 예:
//   부산: "https://3ha.in/r/부산링크ID",
export const STAY_LINKS: Record<string, string> = {
  서울: "https://3ha.in/r/628670",
  부산: "https://3ha.in/r/629231",
  대구: "https://3ha.in/r/629242",
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
