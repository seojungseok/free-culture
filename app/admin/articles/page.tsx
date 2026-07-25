import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, getArticleStats } from "@/lib/articles";
import { SIDO_SLUG } from "@/lib/classify";
import ArticleBody from "@/components/ArticleBody";
import { Container } from "@/components/Band";

// 검토 전용 — 검색엔진 색인 제외
export const metadata: Metadata = {
  title: "글 검토 (관리자)",
  robots: { index: false, follow: false },
};

export default function AdminArticlesPage() {
  const stats = getArticleStats();
  const articles = getAllArticles().sort((a, b) => {
    // 초안 먼저, 최신순
    if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
    return (b.generatedAt || "").localeCompare(a.generatedAt || "");
  });

  return (
    <Container className="max-w-[860px] pb-16 pt-6">
      <h1 className="text-[22px] font-black text-ink">글 검토 (관리자)</h1>
      <p className="mt-1 text-[13px] text-ink-faint">
        시작일 {stats.startDate} · 총 {stats.total} · 초안 <b className="text-paid">{stats.draft}</b> ·
        발행 <b className="text-free">{stats.published}</b>
      </p>
      <div className="mt-2 rounded-lg bg-panel p-3 text-[12.5px] text-ink-soft">
        발행하려면 GitHub의 <b>Actions → “글 발행(수동)”</b>에서 Run workflow (초안을 발행 상태로 전환).
        여기서는 내용만 검토합니다.
      </div>

      {articles.length === 0 && (
        <p className="mt-8 text-ink-faint">아직 생성된 글이 없습니다. (월요일부터 초안 생성 시작)</p>
      )}

      <div className="mt-6 space-y-8">
        {articles.map((a) => {
          const slug = (SIDO_SLUG as Record<string, string>)[a.area];
          return (
            <article key={a.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    a.status === "published" ? "bg-tint text-freedark" : "bg-paid/10 text-paid",
                  ].join(" ")}
                >
                  {a.status === "published" ? "발행됨" : "초안"}
                </span>
                <span className="text-[12.5px] text-ink-faint">
                  {a.area} · {a.typeLabel || a.type} · {a.length ?? "?"}자 · {a.model}
                </span>
                <Link
                  href={`/places/spot/${a.id}`}
                  className="ml-auto text-[12.5px] font-bold text-brandblue hover:underline"
                >
                  상세 열기 ↗
                </Link>
              </div>
              <h2 className="mt-2 text-[18px] font-extrabold text-ink">
                {a.title}
                {slug && <span className="ml-1 text-[12px] font-semibold text-ink-faint">/{slug}</span>}
              </h2>
              <ArticleBody content={a.content} />
              {a.sources && a.sources.length > 0 && (
                <p className="mt-3 break-all text-[11.5px] text-ink-faint">출처: {a.sources.join(" · ")}</p>
              )}
            </article>
          );
        })}
      </div>
    </Container>
  );
}
