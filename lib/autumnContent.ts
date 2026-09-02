import type { TourSpot } from "@/lib/tour";
import type { Restaurant } from "@/lib/nearby";
import { distanceLabel, foodTypeLabel } from "@/lib/nearby";

export type AutumnStory = {
  id: string;
  title: string;
  area: string;
  address: string;
  summary: string;
  why: string[];
  mustSee: string[];
  route: string;
  foods: { title: string; label: string; distance: string; href: string }[];
  sources: { label: string; href: string }[];
};

const AUTUMN_SOURCE = [
  {
    label: "정책브리핑 내장산 가을 탐방 코스",
    href: "https://m.korea.kr/news/policyNewsView.do?newsId=148935987",
  },
  {
    label: "정읍시 단풍생태공원 조성 자료",
    href: "https://www.jeongeup.go.kr/board/view.jeongeup?boardId=BBS_0000019&dataSid=192682&paging=ok&startPage=1906",
  },
  {
    label: "VISITKOREA 내장산 관광특구",
    href: "https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=74158",
  },
];

export function autumnHeroText(total: number): string {
  return [
    `전국 나들이 데이터에서 단풍, 억새, 수목원, 자연휴양림처럼 가을색이 분명한 장소 ${total.toLocaleString()}곳을 골랐어요.`,
    "주소와 사진만 훑는 목록이 아니라, 왜 가을에 가볼 만한지와 주변에서 함께 먹고 둘러볼 동선까지 이어 볼 수 있게 정리했습니다.",
    "대표 명소는 공식 자료를 확인해 더 길게 풀고, 나머지는 사이트 보유 데이터로 계절 추천 이유를 붙입니다.",
  ].join(" ");
}

export function autumnKeywordGuide(keyword: string): string {
  if (keyword === "단풍") return "붉게 물든 나무와 산책길을 중심으로 가을 분위기가 뚜렷한 장소예요.";
  if (keyword === "억새") return "탁 트인 들판이나 능선 풍경이 좋아 가을 사진 나들이로 보기 좋은 테마예요.";
  if (keyword === "수목원") return "나무와 정원을 천천히 둘러보며 계절 변화를 관찰하기 좋은 산책형 나들이예요.";
  if (keyword === "국화") return "가을 꽃과 주변 산책 동선을 함께 보기 좋은 장소를 모았어요.";
  if (keyword === "자연휴양림") return "선선한 날씨에 숲길, 휴식, 가벼운 당일치기를 함께 잡기 좋은 곳이에요.";
  return "가을에 걷고 머물기 좋은 계절 나들이 테마예요.";
}

export function autumnReason(spot: TourSpot): string {
  const text = `${spot.title} ${spot.addr}`;
  if (text.includes("단풍")) {
    return `${spot.area}에서 단풍을 중심으로 찾기 좋은 가을나들이 장소예요. 이름과 위치 정보에서 단풍 테마가 뚜렷해, 가을 산책이나 당일치기 후보로 먼저 비교해볼 만합니다.`;
  }
  if (text.includes("억새")) {
    return `${spot.area}의 억새 풍경을 기대하고 고르기 좋은 장소예요. 선선한 날씨에 야외에서 걷고 사진을 남기는 가을 코스로 잘 맞습니다.`;
  }
  if (text.includes("수목원")) {
    return `${spot.area}의 수목원 나들이 장소예요. 가을에는 나무와 정원 산책을 함께 보기 좋아, 아이나 부모님과 천천히 걷는 일정으로 잡기 좋습니다.`;
  }
  if (text.includes("국화")) {
    return `${spot.area}에서 국화라는 가을 키워드로 함께 볼 만한 장소예요. 주소와 주변 동선을 확인해 가벼운 산책 코스로 묶어보세요.`;
  }
  if (text.includes("자연휴양림")) {
    return `${spot.area}의 자연휴양림이에요. 숲길과 휴식 분위기가 가을 날씨와 잘 맞아, 붐비는 실내보다 바깥에서 걷고 쉬는 나들이로 보기 좋습니다.`;
  }
  return `${spot.area}에서 가을 분위기에 맞춰 고른 나들이 장소예요. 사진, 주소, 주변 장소를 함께 보고 당일 동선으로 비교해보세요.`;
}

export function buildAutumnStories(
  spots: TourSpot[],
  nearbyFoodByPlace: Record<string, (Restaurant & { dist: number })[]>
): AutumnStory[] {
  const naejang = spots.find((p) => p.id === "2715684");
  if (!naejang) return [];

  return [
    {
      id: naejang.id,
      title: naejang.title,
      area: naejang.area,
      address: naejang.addr || "전북특별자치도 정읍시 내장동",
      summary:
        "내장산 단풍생태공원은 전북 정읍에서 가을나들이를 찾을 때 먼저 볼 만한 단풍 테마 공간이에요. 내장호 주변과 내장산 국립공원 입구권에 자리해 산, 호수, 단풍을 한 번에 엮어 볼 수 있고, 등산을 길게 하지 않아도 계절감 있는 산책을 하기 좋습니다.",
      why: [
        "내장산 일대는 가을 단풍으로 유명한 지역이고, 이 공원은 단풍을 주제로 조성된 공간이라 검색 의도와 장소 성격이 잘 맞습니다.",
        "산책로와 데크길을 따라 걸으며 내장산 산줄기와 붉게 물드는 풍경을 함께 볼 수 있어, 사진을 남기기 좋은 가을 코스입니다.",
        "정읍시 자료 기준 내장저수지 위쪽 약 6만㎡ 부지에 단풍 테마 공원으로 추진된 곳이라, 단순 쉼터보다 목적성이 분명합니다.",
      ],
      mustSee: [
        "단풍 산책로와 데크길",
        "내장산 산줄기가 보이는 전망 포인트",
        "내장호 주변 풍경",
        "시간이 넉넉하면 우화정, 내장사 방향 연계",
      ],
      route:
        "가볍게는 단풍생태공원 산책로와 전망 포인트만 둘러보고, 반나절 이상이면 조각공원에서 시작해 단풍생태공원, 우화정, 내장사 방향으로 이어 보세요. 단풍만 짧게 보고 싶은 사람과 내장산 가을 코스를 넓게 보고 싶은 사람 모두에게 출발점이 되는 장소입니다.",
      foods: (nearbyFoodByPlace[naejang.id] || []).slice(0, 4).map((r) => ({
        title: r.title,
        label: foodTypeLabel(r),
        distance: distanceLabel(r.dist),
        href: `/food/spot/${r.id}`,
      })),
      sources: AUTUMN_SOURCE,
    },
  ];
}
