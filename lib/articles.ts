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

/** 사이트 노출용 — 발행(published)된 글만 */
export function getArticle(id: string): PlaceArticle | undefined {
  const a = data.articles[id];
  return a && a.status === "published" ? a : undefined;
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
