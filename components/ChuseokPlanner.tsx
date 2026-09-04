"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ChuseokPlannerEvent = {
  id: string;
  title: string;
  area: string;
  sigungu: string;
  place: string;
  startDate: string;
  endDate: string;
  image: string;
  href: string;
  priceLabel: string;
  isFree: boolean;
  isKids: boolean;
  isTraditional: boolean;
  lat: string;
  lng: string;
};

type Choice = "nearby" | "family" | "free" | "traditional";
const choices: { key: Choice; title: string; detail: string }[] = [
  { key: "nearby", title: "내 주변 문화행사", detail: "현재 위치에서 가까운 순" },
  { key: "family", title: "가족과 함께", detail: "아이·가족 관람 추천" },
  { key: "free", title: "무료 행사", detail: "부담 없이 들르기 좋은 곳" },
  { key: "traditional", title: "전통문화", detail: "명절 분위기를 느끼는 시간" },
];

function distanceKm(lat: number, lng: number, event: ChuseokPlannerEvent) {
  const y = Number(event.lat);
  const x = Number(event.lng);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const rad = Math.PI / 180;
  const a = Math.sin((y - lat) * rad / 2) ** 2 + Math.cos(lat * rad) * Math.cos(y * rad) * Math.sin((x - lng) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDate(start: string, end: string) {
  const short = (value: string) => `${value.slice(4, 6)}.${value.slice(6, 8)}`;
  return start === end ? short(start) : `${short(start)} - ${short(end)}`;
}

export default function ChuseokPlanner({ events }: { events: ChuseokPlannerEvent[] }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [region, setRegion] = useState("전국");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "denied">("idle");
  const regions = useMemo(() => ["전국", ...Array.from(new Set(events.map((event) => event.area).filter(Boolean)))], [events]);
  const visible = useMemo(() => {
    let list = events.filter((event) => region === "전국" || event.area === region);
    if (choice === "family") list = list.filter((event) => event.isKids);
    if (choice === "free") list = list.filter((event) => event.isFree);
    if (choice === "traditional") list = list.filter((event) => event.isTraditional);
    if (choice === "nearby" && location) {
      list = [...list].sort((a, b) => (distanceKm(location.lat, location.lng, a) ?? Infinity) - (distanceKm(location.lat, location.lng, b) ?? Infinity));
    }
    return list.slice(0, 24);
  }, [choice, events, location, region]);

  function choose(next: Choice) {
    setChoice(next);
    if (next !== "nearby" || location || !navigator.geolocation) return;
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => { setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); setLocationState("idle"); },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  return <div className="mx-auto w-full max-w-[1180px] px-5 py-7 sm:px-6 sm:py-10 lg:px-8">
    <section className="overflow-hidden rounded-2xl border border-[#ead8b8] bg-[#fffaf1]">
      <div className="px-5 py-6 sm:px-7 sm:py-8"><p className="text-[12px] font-black text-[#8a622e]">2026 추석 연휴 빠른 찾기</p><h1 className="mt-2 text-[27px] font-black text-ink sm:text-[36px]">추석에 뭐하지?</h1><p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-soft">연휴 계획을 길게 고민하지 말고, 지금 하고 싶은 일을 먼저 골라보세요.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{choices.map((item) => <button key={item.key} type="button" onClick={() => choose(item.key)} className={`min-h-[92px] rounded-xl border px-3 py-3 text-left transition ${choice === item.key ? "border-[#9b6423] bg-[#9b6423] text-white shadow-sm" : "border-[#e7d8c1] bg-white text-ink hover:border-[#c59350]"}`}><strong className="block text-[15px] font-black">{item.title}</strong><span className={`mt-2 block text-[11px] leading-4 ${choice === item.key ? "text-[#ffecd0]" : "text-ink-faint"}`}>{item.detail}</span></button>)}</div>
      </div>
      {choice && <div className="border-t border-[#ead8b8] px-5 py-5 sm:px-7">
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="지역 필터">{regions.map((item) => <button key={item} type="button" onClick={() => setRegion(item)} className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-bold ${region === item ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-[#e7d8c1]"}`}>{item}</button>)}</div>
        {locationState === "loading" && <p className="mt-3 text-[12px] text-ink-soft">현재 위치를 확인하고 있어요.</p>}
        {locationState === "denied" && <p className="mt-3 text-[12px] text-ink-soft">위치 권한을 허용하지 않아 지역별 결과를 보여드려요.</p>}
        <div className="mt-5 flex items-center justify-between"><h2 className="text-[18px] font-black text-ink">{choices.find((item) => item.key === choice)?.title}</h2><span className="text-[12px] text-ink-faint">{visible.length}개</span></div>
        {visible.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((event) => { const km = location ? distanceKm(location.lat, location.lng, event) : null; return <Link key={event.id} href={event.href} className="overflow-hidden rounded-xl border border-[#eadfcf] bg-white transition hover:border-[#bd8540] hover:shadow-sm"><div className="aspect-[4/3] bg-[#f5ede1]">{event.image ? <img src={event.image} alt={`${event.title} 행사 사진`} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl" aria-hidden="true">🌕</div>}</div><div className="p-3"><span className="rounded bg-[#f4ead7] px-1.5 py-1 text-[10px] font-bold text-[#875f2c]">{event.area}</span><h3 className="mt-2 line-clamp-2 text-[14px] font-black leading-5 text-ink">{event.title}</h3><p className="mt-2 text-[12px] font-bold text-ink-soft">{formatDate(event.startDate, event.endDate)}{km !== null ? ` · ${km.toFixed(1)}km` : ""}</p><p className="mt-1 line-clamp-1 text-[12px] text-ink-faint">{event.place || "장소 확인"}</p>{event.priceLabel && <p className="mt-2 text-[11px] font-bold text-free">{event.priceLabel}</p>}</div></Link>; })}</div> : <p className="mt-4 rounded-xl bg-white px-4 py-8 text-center text-sm text-ink-soft">조건에 맞는 정보가 없습니다. 다른 선택이나 지역을 골라보세요.</p>}
      </div>}
    </section>
  </div>;
}
