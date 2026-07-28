// 자동 생성 글(초안/발행) 접근 — data/place-articles.json (GitHub Action이 커밋)
import articlesData from "@/data/place-articles.json";

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

/** 사이트 노출용 — 발행(published)된 글만. 방문 팁 섹션은 서빙 시 제거 */
export function getArticle(id: string): PlaceArticle | undefined {
  const a = data.articles[id];
  if (!a || a.status !== "published") return undefined;
  return { ...a, content: stripVisitTips(a.content) };
}

/** 관리/검토용 — 상태 무관 */
export function getArticleAny(id: string): PlaceArticle | undefined {
  return data.articles[id];
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
