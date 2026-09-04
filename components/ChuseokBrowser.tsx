"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChuseokEvent } from "@/lib/chuseok";
import { formatChuseokDate } from "@/lib/chuseok";

type Filter = "all" | "free" | "night" | "kids" | "traditional" | "experience" | "performance";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "free", label: "무료행사" },
  { key: "night", label: "야간행사" },
  { key: "kids", label: "아이와함께" },
  { key: "traditional", label: "전통문화" },
  { key: "experience", label: "체험행사" },
  { key: "performance", label: "공연·축제" },
];
const REGIONS = ["서울", "경기", "인천", "부산", "제주", "기타지역"];

function distanceKm(lat: number, lng: number, e: ChuseokEvent): number | null {
  const y = Number(e.lat), x = Number(e.lng);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const rad = Math.PI / 180;
  const a = Math.sin((y - lat) * rad / 2) ** 2 + Math.cos(lat * rad) * Math.cos(y * rad) * Math.sin((x - lng) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matches(e: ChuseokEvent, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "free") return e.isFree;
  if (filter === "night") return e.isNight;
  if (filter === "kids") return e.isKids;
  if (filter === "traditional") return e.isTraditional;
  if (filter === "experience") return /체험|놀이|만들기/.test(`${e.title} ${e.description}`);
  return /공연|축제|마당|콘서트/.test(`${e.title} ${e.description}`);
}

export default function ChuseokBrowser({ events, compact = false }: { events: ChuseokEvent[]; compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") as Filter | null;
  const regionSlug = searchParams.get("region");
  const initialRegion = regionSlug === "seoul" ? "서울" : regionSlug === "gyeonggi" ? "경기" : regionSlug === "incheon" ? "인천" : regionSlug === "busan" ? "부산" : regionSlug === "jeju" ? "제주" : "";
  const [filter, setFilter] = useState<Filter>(initialFilter && FILTERS.some((item) => item.key === initialFilter) ? initialFilter : "all");
  const [region, setRegion] = useState(initialRegion);
  const [radius, setRadius] = useState("all");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "denied">("idle");

  const filtered = useMemo(() => {
    const list = events.filter((e) => matches(e, filter) && (!region || (region === "기타지역" ? !REGIONS.slice(0, 5).includes(e.area) : e.area === region)));
    if (!location) return list;
    return list
      .map((e) => ({ e, distance: distanceKm(location.lat, location.lng, e) }))
      .filter(({ distance }) => radius === "all" || (distance !== null && distance <= Number(radius)))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .map(({ e }) => e);
  }, [events, filter, location, radius, region]);

  function locate() {
    if (!navigator.geolocation) { setLocationState("denied"); return; }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationState("ready"); },
      () => { setLocationState("denied"); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  function updateFilter(next: Filter) {
    setFilter(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("filter"); else params.set("filter", next);
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  function updateRegion(next: string) {
    setRegion(next);
    const params = new URLSearchParams(searchParams.toString());
    const slug = next === "서울" ? "seoul" : next === "경기" ? "gyeonggi" : next === "인천" ? "incheon" : next === "부산" ? "busan" : next === "제주" ? "jeju" : "";
    if (slug) params.set("region", slug); else params.delete("region");
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  return (
    <section className={compact ? "mx-auto w-full max-w-[1180px] px-5 pt-6 sm:px-6 lg:px-8" : "mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-6 sm:py-8 lg:px-8"}>
      <div className="overflow-hidden rounded-2xl border border-[#eadfcf] bg-[#fffdf8]">
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="mb-1 flex items-center gap-2"><span className="rounded-full bg-[#f0e6d5] px-2 py-1 text-[11px] font-black text-[#84633d]">2026 추석 특별</span></div>
          <h2 className="text-[21px] font-black tracking-tight text-ink sm:text-[25px]">🌕 2026 추석 연휴, 어디로 갈까요?</h2>
          <p className="mt-1 text-[13px] leading-5 text-ink-soft">추석 무료행사부터 아이와 갈 곳, 야간축제까지 가까운 곳에서 바로 찾아보세요.</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <button onClick={locate} className="min-h-12 rounded-xl bg-brandblue px-3 py-2 text-[13px] font-black text-white shadow-sm transition hover:bg-blue-700">📍 내 주변 추석행사</button>
            <button onClick={() => updateFilter("free")} className="min-h-12 rounded-xl bg-white px-3 py-2 text-[13px] font-extrabold text-ink ring-1 ring-[#e8dece] transition hover:bg-[#fff8ed]">🎁 추석 무료행사</button>
            <button onClick={() => updateFilter("night")} className="min-h-12 rounded-xl bg-white px-3 py-2 text-[13px] font-extrabold text-ink ring-1 ring-[#e8dece] transition hover:bg-[#fff8ed]">🌙 추석 야간행사</button>
            <button onClick={() => updateFilter("kids")} className="min-h-12 rounded-xl bg-white px-3 py-2 text-[13px] font-extrabold text-ink ring-1 ring-[#e8dece] transition hover:bg-[#fff8ed]">👨‍👩‍👧 아이와 추석나들이</button>
          </div>
        </div>

        <div className="border-t border-[#eadfcf] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="추석 행사 필터">
            {FILTERS.map((item) => <button key={item.key} onClick={() => updateFilter(item.key)} className={["rounded-full px-3 py-1.5 text-[12px] font-bold", filter === item.key ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-[#e8dece]"].join(" ")}>{item.label}</button>)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold text-ink-faint">지역</span>
            {["", ...REGIONS].map((item) => <button key={item || "all-region"} onClick={() => updateRegion(item)} className={["rounded-full px-2.5 py-1 text-[12px] font-semibold", region === item ? "bg-[#f0e6d5] text-[#765735]" : "text-ink-faint hover:text-ink"].join(" ")}>{item || "전국"}</button>)}
            {location && <><span className="ml-1 text-[12px] font-bold text-ink-faint">거리</span>{["5", "10", "30", "all"].map((value) => <button key={value} onClick={() => setRadius(value)} className={["rounded-full px-2.5 py-1 text-[12px] font-semibold", radius === value ? "bg-[#f0e6d5] text-[#765735]" : "text-ink-faint"].join(" ")}>{value === "all" ? "상관없음" : `${value}km`}</button>)}</>}
          </div>
          {locationState === "loading" && <p className="mt-3 text-[12px] text-ink-soft">현재 위치를 확인하고 있어요.</p>}
          {locationState === "denied" && <p className="mt-3 text-[12px] font-semibold text-ink-soft">지역을 선택해서 추석행사를 찾아보세요.</p>}
          {locationState === "ready" && !events.some((e) => e.lat && e.lng) && <p className="mt-3 text-[12px] font-semibold text-ink-soft">현재 행사에는 거리 좌표가 없어 지역 필터를 함께 이용해 주세요.</p>}
        </div>

        <div className="border-t border-[#eadfcf] px-5 py-5 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-[17px] font-black text-ink">🌕 올해 추석에 가볼 만한 행사</h3>{!compact && <span className="text-[12px] text-ink-faint">{filtered.length}건</span>}</div>
          {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice(0, compact ? 3 : 18).map((e) => <EventCard key={e.id} event={e} location={location} />)}</div> : <p className="rounded-xl bg-white px-4 py-8 text-center text-[13px] text-ink-soft">현재 확인된 행사 중 조건에 맞는 행사가 없어요. 다른 지역이나 필터를 선택해 보세요.</p>}
          {compact && <Link href="/chuseok" className="mt-4 block text-center text-[13px] font-bold text-free">추석 특별관에서 전체 필터 보기 →</Link>}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, location }: { event: ChuseokEvent; location: { lat: number; lng: number } | null }) {
  const km = location ? distanceKm(location.lat, location.lng, event) : null;
  return <article className="overflow-hidden rounded-xl bg-white ring-1 ring-[#eadfcf]">
    <div className="flex h-24 items-center justify-center bg-[#f5ede1] text-4xl">{event.image ? <img src={event.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : "🌕"}</div>
    <div className="p-3.5"><h4 className="line-clamp-2 text-[14px] font-extrabold text-ink">{event.title}</h4><p className="mt-1 text-[12px] text-ink-soft">{event.area} {event.sigungu} · {event.place}</p><p className="mt-1 text-[12px] font-semibold text-ink-soft">{formatChuseokDate(event.startDate, event.endDate)}{km !== null ? ` · 약 ${km.toFixed(1)}km` : ""}</p><p className="mt-2 line-clamp-2 text-[12px] leading-5 text-ink-faint">{event.description}</p><div className="mt-2 flex flex-wrap gap-1">{event.isFree && <span className="rounded bg-[#e9f8ef] px-1.5 py-0.5 text-[10px] font-bold text-[#27814b]">무료</span>}{event.isNight && <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[10px] font-bold text-[#4b5ca8]">야간</span>}{event.isKids && <span className="rounded bg-[#fff3df] px-1.5 py-0.5 text-[10px] font-bold text-[#9a6928]">아이와함께</span>}{event.isTraditional && <span className="rounded bg-[#f5eee5] px-1.5 py-0.5 text-[10px] font-bold text-[#84633d]">전통문화</span>}</div><a href={event.officialUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[12px] font-bold text-free">자세히 보기 ↗</a></div>
  </article>;
}
