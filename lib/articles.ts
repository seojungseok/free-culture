// 자동 생성 글(초안/발행) 접근 — data/place-articles.json (GitHub Action이 커밋)
import articlesData from "@/data/place-articles.json";
import { AUTUMN_ARTICLE_OVERRIDES } from "@/data/autumnArticleOverrides";
import { getTourById } from "@/lib/tour";

export interface PlaceArticle {
  status: "draft" | "published";
  generatedAt: string;
  publishedAt: string | null;
  area: string;
  type: string;
  typeLabel?: string;
  title: string;
  content: string; // 마크다운
  sources?: string[];
  model?: string;
  length?: number;
}

const data = articlesData as unknown as {
  startDate: string;
  generatedAt: string | null;
  articles: Record<string, PlaceArticle>;
};

/**
 * 본문 끝의 "## 방문 팁" 섹션 제거.
 * 이 섹션은 생성 시점에 요금·시간·주차를 대부분 "정보 없음"으로 채워
 * 상세 페이지의 실제 "방문 정보"(detailIntro 캐시) 표와 중복·모순됨.
 * → 서빙 시점에 통째로 걷어내고 "방문 정보" 표 하나만 남긴다.
 */
export function stripVisitTips(content: string): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((l) => /^#{2,3}\s*방문\s*팁/.test(l));
  if (start === -1) return content;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{2,3}\s/.test(lines[i])) { end = i; break; }
  }
  const kept = [...lines.slice(0, start), ...lines.slice(end)];
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function addAutumnReason(id: string, content: string): string {
  const spot = getTourById(id);
  if (!spot || !/단풍|억새|수목원|국화|코스모스|자연휴양림|관악산/.test(`${spot.title} ${spot.addr}`)) return content;
  if (/##\s*(가을에 왜 좋은가요|가을나들이로 좋은 이유|언제 가면 좋을까요)/.test(content)) return content;
  const text = `${spot.title} ${spot.addr}`;
  const reason = text.includes("단풍") ? "단풍 산책과 계절 사진을 즐기기 좋은 장소" : text.includes("억새") ? "억새 풍경과 탁 트인 가을 조망을 보기 좋은 장소" : text.includes("국화") || text.includes("코스모스") ? "가을꽃과 야외 산책을 함께 즐기기 좋은 장소" : text.includes("수목원") ? "나무와 정원을 천천히 걸으며 가을 식생을 살펴보기 좋은 장소" : "선선한 날씨에 숲길을 걷고 쉬기 좋은 장소";
  return `${content.trim()}\n\n## 가을에 왜 좋은가요\n\n${spot.title}은(는) ${reason}예요. ${spot.area}에서 가을나들이를 계획한다면 대표사진과 주소를 먼저 확인하고, 현장에서는 무리하지 않는 범위에서 숲길·정원·전망 구간을 나누어 둘러보세요.`;
}

/** 사이트 노출용 — 발행(published)된 글만. 방문 팁 섹션은 서빙 시 제거 */
export function getArticle(id: string): PlaceArticle | undefined {
  const a = { ...data.articles[id], ...AUTUMN_ARTICLE_OVERRIDES[id] } as PlaceArticle;
  if (!a || a.status !== "published") return undefined;
  return { ...a, content: addAutumnReason(id, stripVisitTips(a.content)) };
}

/** 관리/검토용 — 상태 무관 */
export function getArticleAny(id: string): PlaceArticle | undefined {
  return data.articles[id] || (AUTUMN_ARTICLE_OVERRIDES[id] as PlaceArticle | undefined);
}

export function getAllArticles(): (PlaceArticle & { id: string })[] {
  return Object.entries(data.articles).map(([id, a]) => ({ id, ...a }));
}

export function getArticleStats() {
  const all = Object.values(data.articles);
  return {
    startDate: data.startDate,
    total: all.length,
    draft: all.filter((a) => a.status === "draft").length,
    published: all.filter((a) => a.status === "published").length,
  };
}
