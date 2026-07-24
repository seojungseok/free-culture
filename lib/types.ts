export type PriceType =
  | "free"
  | "free_estimated"
  | "partial_free"
  | "cheap"
  | "paid"
  | "unknown";

export interface CultureEvent {
  /** API의 seq (고유 id) */
  id: string;
  title: string;
  /** 원본 요금 문자열 (표시용) */
  priceRaw: string;
  /** 분류 결과 */
  priceType: PriceType;
  /** 요약 배지 텍스트 (예: "무료", "조건부 무료", "1만원 이하") */
  priceLabel: string;
  /** 최저가(원). 무료 tier가 있으면 0 */
  priceMin: number | null;
  /** 최고가(원) */
  priceMax: number | null;
  /** 조건부 무료일 때 무료 조건 문구 (예: "만 65세 이상 무료") */
  freeCondition: string;

  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD

  place: string;
  area: string; // 시도
  sigungu: string;
  address: string;

  realmName: string; // 분야명 (전시, 공연 등)
  /** 내부 분류용 장르 키 (URL slug) */
  genreKey: string;

  imgUrl: string; // 포스터
  officialUrl: string; // 공식 상세 페이지
  phone: string;
  contents: string; // 설명 (있을 때)

  gpsX: string;
  gpsY: string;

  /** 큰 행사 여부 (자동 팝업 대상) */
  featured: boolean;
  /** featured 정렬용 점수 (높을수록 크게 취급) */
  featuredScore: number;
  /** 대상 태그 (kids/seniors/couple/solo/group) */
  audiences: string[];
}

export interface EventsData {
  generatedAt: string; // ISO
  count: number;
  events: CultureEvent[];
}
