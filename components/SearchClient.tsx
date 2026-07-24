"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { CultureEvent } from "@/lib/types";
import PosterCard from "./PosterCard";
import SearchBox from "./SearchBox";

export default function SearchClient({ items }: { items: CultureEvent[] }) {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const [visible, setVisible] = useState(40);

  useEffect(() => setVisible(40), [q]);

  const results = useMemo(() => {
    if (!q) return [];
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((e) => {
      const hay = `${e.title} ${e.place} ${e.area} ${e.sigungu} ${e.realmName}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, q]);

  const shown = results.slice(0, visible);

  return (
    <div className="py-6">
      <div className="mx-auto max-w-xl">
        <SearchBox size="lg" defaultValue={q} placeholder="행사명·장소·지역 검색" />
      </div>

      {q ? (
        <>
          <p className="mt-6 text-sm text-ink-soft">
            <b className="text-ink">&ldquo;{q}&rdquo;</b> 검색 결과{" "}
            <b className="text-ink">{results.length.toLocaleString()}</b>건
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-20 text-center">
              <div className="text-4xl">🔍</div>
              <p className="mt-3 font-semibold text-ink-soft">
                검색 결과가 없어요
              </p>
              <p className="mt-1 text-sm text-ink-faint">
                다른 키워드로 검색하거나 지역·분야로 둘러보세요.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.map((ev, i) => (
                <PosterCard key={ev.id} ev={ev} priority={i < 5} />
              ))}
            </div>
          )}

          {visible < results.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + 40)}
                className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
              >
                더 보기 ({(results.length - visible).toLocaleString()}개 남음)
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="mt-8 text-center text-sm text-ink-faint">
          찾고 싶은 행사명, 장소, 지역을 입력해보세요.
        </p>
      )}
    </div>
  );
}
