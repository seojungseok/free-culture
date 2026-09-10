// 기존 숙소 제휴광고 종료. 대응되는 검수 완료 와그 상품만 새 입장권 글에서 연결합니다.
export const STAY_LINKS: Record<string, string> = {};
export function stayLinkFor(_area?: string, _addr?: string): { region: string; href: string } | null {
  return null;
}