// 사용자 제공 원본 제휴 URL. 지역 검색 URL로 변형하거나 추적 파라미터를 추가하지 않는다.
export const DOMESTIC_STAY_URL = "https://3ha.in/r/722026";
export const STAY_LINKS: Record<string, string> = { 전국: DOMESTIC_STAY_URL };
export function stayLinkFor(area?: string, _addr?: string): { region: string; href: string } | null {
  return { region: area || "", href: DOMESTIC_STAY_URL };
}
