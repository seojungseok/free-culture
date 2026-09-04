"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PetPlace = { id: string; title: string; address: string; area: string; image: string; type: string; summary: string };
const regions = ["전체", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const types = [{ k: "", t: "전체" }, { k: "12", t: "관광지" }, { k: "14", t: "문화시설" }, { k: "28", t: "체험·레포츠" }, { k: "39", t: "음식점" }, { k: "15", t: "축제" }];

export default function PetTravelBrowser() {
  const [items, setItems] = useState<PetPlace[]>([]);
  const [region, setRegion] = useState("전체"); const [type, setType] = useState(""); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/pet-travel").then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  const list = useMemo(() => items.filter((p) => (!region || region === "전체" || p.area === region) && (!type || p.type === type) && (!query || `${p.title} ${p.address}`.includes(query))).slice(0, 120), [items, region, type, query]);
  return (
    <div className="bg-panel"><div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row"><input aria-label="반려동물 여행지 검색" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="장소명이나 지역을 검색해보세요" className="min-h-11 flex-1 rounded-xl border border-line bg-white px-4 text-[14px] outline-none focus:border-free" /><span className="flex min-h-11 items-center rounded-xl bg-white px-4 text-[13px] font-bold text-ink-soft">{loading ? "여행지 불러오는 중" : `${list.length.toLocaleString()}곳`}</span></div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{regions.map((r) => <button key={r} onClick={() => setRegion(r)} className={["min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold", region === r ? "bg-free text-white" : "border border-line bg-white text-ink-soft"].join(" ")}>{r}</button>)}</div>
      <div className="mt-3 flex flex-wrap gap-2">{types.map((t) => <button key={t.k} onClick={() => setType(t.k)} className={["min-h-9 rounded-full px-3.5 text-[13px] font-bold", type === t.k ? "bg-ink text-white" : "border border-line bg-white text-ink-soft"].join(" ")}>{t.t}</button>)}</div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <Link key={p.id} href={`/pet-travel/${p.id}`} className="group block overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-free"><div className="aspect-[16/9] bg-tint">{p.image ? <img src={p.image} alt={`${p.title} 반려동물 여행 사진`} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">🐾</div>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><h2 className="text-[16px] font-extrabold text-ink">{p.title}</h2>{p.area && <span className="shrink-0 text-[12px] font-bold text-free">{p.area}</span>}</div>{p.address && <p className="mt-2 text-[13px] leading-5 text-ink-soft">{p.address}</p>}<div className="mt-3 flex flex-wrap gap-1.5"><Badge text="반려동물 동반" />{p.type && <Badge text={types.find((x) => x.k === p.type)?.t || "여행지"} />}</div>{p.summary && <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-ink-soft">{p.summary}</p>}<span className="mt-4 inline-block text-[13px] font-bold text-free">여행지 정보 보기 →</span></div></Link>)}</div>
      {!loading && !list.length && <p className="py-16 text-center text-[14px] text-ink-soft">조건에 맞는 반려동물 여행지가 없습니다. 지역이나 유형을 바꿔보세요.</p>}
      <nav className="mt-10 border-t border-line pt-5"><p className="text-[13px] font-black text-ink">함께 찾아보기</p><div className="mt-2 flex flex-wrap gap-4 text-[13px] font-bold text-free"><Link href="/camping">반려동물 동반 캠핑</Link><Link href="/season">반려동물과 가을나들이</Link><Link href="/course">가족 여행코스</Link><Link href="/food">여행지 주변 맛집</Link></div></nav>
    </div></div>
  );
}
function Badge({ text }: { text: string }) { return <span className="rounded-md bg-tint px-2 py-1 text-[11px] font-bold text-ink-soft">{text}</span>; }
