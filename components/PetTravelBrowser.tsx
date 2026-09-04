"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PetPlace = {
  id: string;
  title: string;
  address: string;
  area: string;
  image: string;
  type: string;
  summary: string;
};

const regions = ["전체", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const types = [
  { k: "", t: "전체" },
  { k: "12", t: "관광지" },
  { k: "14", t: "문화시설" },
  { k: "28", t: "체험·레포츠" },
  { k: "39", t: "음식점" },
  { k: "15", t: "축제" },
];

export default function PetTravelBrowser() {
  const [items, setItems] = useState<PetPlace[]>([]);
  const [region, setRegion] = useState("전체");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pet-travel")
      .then((response) => response.json())
      .then((json) => setItems(json.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items
      .filter((place) => {
        const searchable = `${place.title} ${place.address} ${place.summary}`.toLowerCase();
        return (!region || region === "전체" || place.area === region) && (!type || place.type === type) && (!keyword || searchable.includes(keyword));
      })
      .slice(0, 120);
  }, [items, region, type, query]);

  const regionCounts = useMemo(
    () => items.reduce<Record<string, number>>((counts, item) => {
      if (item.area) counts[item.area] = (counts[item.area] || 0) + 1;
      return counts;
    }, {}),
    [items],
  );

  return (
    <div className="bg-panel">
      <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-label="반려동물 여행지 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="장소명이나 지역을 검색해보세요"
            className="min-h-11 flex-1 rounded-xl border border-line bg-white px-4 text-[14px] outline-none focus:border-free"
          />
          <span className="flex min-h-11 items-center rounded-xl bg-white px-4 text-[13px] font-bold text-ink-soft">
            {loading ? "여행지 불러오는 중" : `${list.length.toLocaleString()}곳`}
          </span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {regions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={["min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold", region === item ? "bg-free text-white" : "border border-line bg-white text-ink-soft"].join(" ")}
            >
              {item} <span className="ml-0.5 text-[11px] opacity-75">{item === "전체" ? items.length : regionCounts[item] || 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {types.map((item) => (
            <button
              key={item.k}
              type="button"
              onClick={() => setType(item.k)}
              className={["min-h-9 rounded-full px-3.5 text-[13px] font-bold", type === item.k ? "bg-ink text-white" : "border border-line bg-white text-ink-soft"].join(" ")}
            >
              {item.t}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {list.map((place) => (
            <Link
              key={place.id}
              href={`/pet-travel/${place.id}`}
              prefetch={false}
              className="group block overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-free"
            >
              <div className="aspect-[4/3] bg-tint">
                {place.image ? (
                  <img src={place.image} alt={`${place.title} 반려동물 여행 사진`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-[14px] font-extrabold leading-5 text-ink sm:text-[16px]">{place.title}</h2>
                  {place.area && <span className="shrink-0 text-[11px] font-bold text-free sm:text-[12px]">{place.area}</span>}
                </div>
                {place.address && <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-ink-soft sm:text-[13px] sm:leading-5">{place.address}</p>}
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge text="반려동물 동반" />
                  {place.type && <Badge text={types.find((item) => item.k === place.type)?.t || "여행지"} />}
                </div>
                {place.summary && <p className="mt-3 line-clamp-2 text-[11px] leading-4 text-ink-soft sm:text-[13px] sm:leading-5">{place.summary}</p>}
                <span className="mt-3 inline-block text-[11px] font-bold text-free sm:mt-4 sm:text-[13px]">여행지 정보 보기 →</span>
              </div>
            </Link>
          ))}
        </div>

        {!loading && !list.length && <p className="py-16 text-center text-[14px] text-ink-soft">조건에 맞는 반려동물 여행지가 없습니다. 지역이나 유형을 바꿔보세요.</p>}

        <nav className="mt-10 border-t border-line pt-5" aria-label="관련 여행 정보">
          <p className="text-[13px] font-black text-ink">함께 찾아보기</p>
          <div className="mt-2 flex flex-wrap gap-4 text-[13px] font-bold text-free">
            <Link href="/camping">반려동물 동반 캠핑</Link>
            <Link href="/season">반려동물과 가을나들이</Link>
            <Link href="/course">가족 여행코스</Link>
            <Link href="/food">여행지 주변 맛집</Link>
          </div>
        </nav>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-md bg-tint px-1.5 py-1 text-[10px] font-bold text-ink-soft sm:px-2 sm:text-[11px]">{text}</span>;
}
