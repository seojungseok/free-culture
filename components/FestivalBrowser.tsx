"use client";

import { useMemo, useState } from "react";
import type { Festival } from "@/lib/festivals";
import { fmtMd } from "@/lib/festivals";

const REGIONS = ["전국", "서울", "경기", "인천", "강원", "충북", "충남", "대전", "전북", "전남", "광주", "경북", "대구", "경남", "부산", "울산", "제주"];

function ymdNow() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function formatRange(start: string, end: string) {
  return `${fmtMd(start)} ~ ${fmtMd(end)}`;
}

function introFor(festival: Festival) {
  if (festival.description) return festival.description;
  return `${festival.area}에서 열리는 ${festival.title}입니다. ${festival.place || festival.addr || "행사 장소"}에서 진행되며, 정확한 프로그램과 운영 내용은 공식 안내에서 확인할 수 있습니다.`;
}

function tagsFor(festival: Festival) {
  const text = `${festival.title} ${festival.description || ""}`;
  return ["야간", "전통", "음악", "미술", "공연", "가족", "역사", "먹거리"].filter((tag) => text.includes(tag)).slice(0, 3);
}

export default function FestivalBrowser({ festivals, initialRegion = "전국", initialQuery = "" }: { festivals: Festival[]; initialRegion?: string; initialQuery?: string }) {
  const [region, setRegion] = useState(REGIONS.includes(initialRegion) ? initialRegion : "전국");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const today = ymdNow();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return festivals
      .filter((f) => region === "전국" || f.area === region)
      .filter((f) => period === "all" || (period === "ongoing" ? f.startDate <= today && f.endDate >= today : f.startDate > today))
      .filter((f) => !q || [f.title, f.addr, f.area, f.place, f.description].filter(Boolean).join(" ").toLowerCase().includes(q))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [festivals, region, period, query, today]);
  const regionCounts = useMemo(() => festivals.reduce<Record<string, number>>((counts, festival) => { counts[festival.area] = (counts[festival.area] || 0) + 1; return counts; }, {}), [festivals]);

  return (
    <div>
      <div className="border-y border-line bg-[#f7fafc] px-5 py-4 sm:rounded-2xl sm:border sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm text-ink-soft lg:w-[320px]">
            <span aria-hidden="true" className="text-lg">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="축제명·지역·장소 검색" className="w-full bg-transparent outline-none placeholder:text-ink-faint" />
          </label>
          <div className="flex flex-wrap gap-2" aria-label="축제 기간 필터">
            {[['all', '전체'], ['ongoing', '진행중'], ['upcoming', '예정']].map(([key, label]) => <button key={key} type="button" onClick={() => setPeriod(key)} className={`rounded-full border px-3 py-2 text-[13px] font-bold ${period === key ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft"}`}>{label}</button>)}
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="축제 지역 필터">
          {REGIONS.map((item) => <button key={item} type="button" onClick={() => setRegion(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[13px] font-bold ${region === item ? "border-free bg-free text-white" : "border-line bg-white text-ink-soft"}`}>{item} <span className="ml-0.5 text-[11px] opacity-75">{item === "전국" ? festivals.length : regionCounts[item] || 0}</span></button>)}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-[14px] font-bold text-ink">{filtered.length.toLocaleString()}개의 축제</p>
        <p className="text-[12px] text-ink-faint">공식 데이터 기준 · 일정은 방문 전 확인</p>
      </div>
      {filtered.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((f) => <article key={f.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <a href={`/festivals/${f.id}`} className="block"><div className="aspect-[4/3] bg-tint">{f.image ? <img src={f.image} alt={`${f.title} 축제 현장 사진`} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">🎉</div>}</div></a>
            <div className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold"><span className="rounded bg-[#eaf7ef] px-2 py-1 text-free">{f.area}</span><span className="rounded bg-[#f2f4f7] px-2 py-1 text-ink-soft">{f.startDate <= today && f.endDate >= today ? "진행중" : "예정"}</span></div>
              <h2 className="mt-2 line-clamp-2 text-[14px] font-black leading-5 text-ink sm:text-[17px] sm:leading-6"><a href={`/festivals/${f.id}`} className="hover:text-free">{f.title}</a></h2>
              <p className="mt-2 text-[12px] font-bold text-ink-soft sm:text-[13px]">{formatRange(f.startDate, f.endDate)}</p>
              <p className="mt-1 line-clamp-1 text-[12px] leading-5 text-ink-faint sm:text-[13px]">{f.place || f.addr || "장소는 상세 페이지에서 확인"}</p>
              <section className="mt-3 hidden border-t border-line pt-3 sm:block">
                <h3 className="text-[12px] font-black text-ink">축제 소개</h3>
                <p className="mt-1 text-[13px] leading-5 text-ink-soft">{introFor(f)}</p>
              </section>
              <dl className="mt-3 hidden grid-cols-[58px_1fr] gap-x-2 gap-y-1 text-[12px] leading-5 sm:grid">
                <dt className="font-bold text-ink-faint">개최 지역</dt><dd className="text-ink-soft">{f.area}</dd>
                <dt className="font-bold text-ink-faint">개최 장소</dt><dd className="text-ink-soft">{f.place || "공식 안내 확인"}</dd>
                <dt className="font-bold text-ink-faint">주소</dt><dd className="text-ink-soft">{f.addr || "주소는 공식 안내 확인"}</dd>
                {f.tel && <><dt className="font-bold text-ink-faint">문의</dt><dd className="text-ink-soft">{f.tel}</dd></>}
              </dl>
              {tagsFor(f).length > 0 && <p className="mt-3 hidden flex-wrap gap-1.5 sm:flex">{tagsFor(f).map((tag) => <span key={tag} className="rounded-full bg-[#fff4df] px-2 py-1 text-[11px] font-bold text-[#99631c]">#{tag}</span>)}</p>}
              <p className="mt-3 hidden rounded-lg bg-[#f7fafc] px-3 py-2 text-[12px] leading-5 text-ink-faint sm:block">방문 전 행사 일정, 입장료, 주차와 우천 취소 여부를 공식 안내에서 확인하세요.</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-bold sm:mt-4">
                <a href={`/festivals/${f.id}`} className="text-free">축제 정보 보기 →</a>
                <a href={`https://map.kakao.com/?q=${encodeURIComponent(f.addr || f.title)}`} target="_blank" rel="noreferrer" className="text-free">지도에서 보기 ↗</a>
                {f.homepage && <a href={f.homepage} target="_blank" rel="noreferrer" className="text-brandblue">공식 홈페이지 ↗</a>}
              </div>
            </div>
          </article>)}
        </div>
      ) : <div className="mt-3 rounded-xl border border-dashed border-line bg-[#fafafa] px-5 py-14 text-center text-sm text-ink-soft">조건에 맞는 축제가 없습니다. 지역이나 기간을 바꿔보세요.</div>}
    </div>
  );
}
