import type { Metadata } from "next";
import Link from "next/link";
import { search, KIND_LABEL } from "@/lib/search";
import SearchBox from "@/components/SearchBox";
import SearchCard from "@/components/SearchCard";
import { Container } from "@/components/Band";

export const metadata: Metadata = {
  title: "통합 검색 — 나들이·문화행사·축제·맛집",
  description: "전국 나들이·문화행사·축제·맛집을 지역·유형·가격으로 한 번에 검색하세요.",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = ["인천 나들이", "서울 무료 공연", "인천 캠핑장", "해운대 가볼만한 곳", "부산 박물관", "경기 체험"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const res = query ? search(query) : null;

  return (
    <Container className="pb-14">
      <h1 className="sr-only">통합 검색</h1>
      <div className="py-6">
        <div className="mx-auto max-w-xl">
          <SearchBox size="lg" defaultValue={query} placeholder="지역·유형으로 검색 (예: 인천 무료 공연)" />
        </div>

        {!query ? (
          <div className="mx-auto mt-8 max-w-xl text-center">
            <p className="text-sm text-ink-faint">찾고 싶은 지역·유형을 입력해보세요.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:border-free/40 hover:text-free">
                  {s}
                </Link>
              ))}
            </div>
          </div>
        ) : res && res.total > 0 ? (
          <>
            <p className="mt-6 text-sm text-ink-soft">
              <b className="text-ink">&ldquo;{query}&rdquo;</b> 검색 결과 <b className="text-ink">{res.total.toLocaleString()}</b>건
              <span className="ml-2 text-ink-faint">
                {res.groups.map((g) => `${g.label} ${g.count}`).join(" · ")}
              </span>
            </p>
            {res.groups.map((g) => (
              <section key={g.kind} className="mt-8">
                <h2 className="mb-3 text-[16px] font-extrabold text-ink">
                  {KIND_LABEL[g.kind]} <span className="text-free">{g.count.toLocaleString()}</span>
                  {g.count > g.items.length && (
                    <span className="ml-2 text-[12px] font-semibold text-ink-faint">상위 {g.items.length}개 표시</span>
                  )}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {g.items.map((doc) => (
                    <SearchCard key={`${doc.kind}-${doc.id}`} doc={doc} />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-16 text-center">
              <div className="text-4xl">🔍</div>
              <p className="mt-3 font-semibold text-ink-soft">&ldquo;{query}&rdquo; 결과가 없어요</p>
              <p className="mt-1 text-sm text-ink-faint">조건을 바꿔보세요. 지역·가격을 빼거나 다른 유형으로 검색해보세요.</p>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:border-free/40 hover:text-free">
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
