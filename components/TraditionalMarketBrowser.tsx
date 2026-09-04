"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MARKET_REGIONS, type TraditionalMarket } from "@/lib/traditionalMarkets";

const distance = (a: number, b: number, c: number, d: number) => {
  const rad = (n: number) => n * Math.PI / 180;
  const x = rad(c - a), y = rad(d - b);
  const h = Math.sin(x / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(y / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};
const yes = (v: boolean | null) => v === true ? "가능" : v === false ? "없음" : "";

export default function TraditionalMarketBrowser({ initial, initialRegion = "전체" }: { initial: TraditionalMarket[]; initialRegion?: string }) {
  const [markets, setMarkets] = useState(initial);
  const [region, setRegion] = useState(initialRegion);
  const [query, setQuery] = useState("");
  const [parking, setParking] = useState(false);
  const [giftcard, setGiftcard] = useState(false);
  const [permanent, setPermanent] = useState(false);
  const [nearby, setNearby] = useState<number | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  useEffect(() => { if (!initial.length) fetch("/api/traditional-markets").then((r) => r.json()).then((j) => setMarkets(j.markets || [])).catch(() => {}); }, [initial.length]);
  const list = useMemo(() => markets.filter((m) => {
    if (region !== "전체" && m.region !== region) return false;
    if (query && !m.name.includes(query)) return false;
    if (parking && m.hasParking !== true) return false;
    if (giftcard && m.giftcard !== true) return false;
    if (permanent && !/상설|매일|연중/.test(m.openingType)) return false;
    if (position && nearby !== null && distance(position.lat, position.lng, m.latitude, m.longitude) > nearby) return false;
    return true;
  }).map((m) => ({ m, d: position ? distance(position.lat, position.lng, m.latitude, m.longitude) : 0 }))
    .sort((a, b) => position ? a.d - b.d : a.m.name.localeCompare(b.m.name, "ko")).map(({ m, d }) => ({ ...m, distance: d })), [markets, region, query, parking, giftcard, permanent, nearby, position]);
  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((p) => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); setNearby(10); setLocating(false); }, () => { setLocating(false); setNearby(null); });
  }
  return <div className="bg-panel"><div className="mx-auto max-w-[1180px] px-5 py-5 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">시장명 검색</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="시장명을 검색해보세요" className="min-h-11 w-full rounded-xl border border-line bg-white px-4 text-[14px] outline-none focus:border-free" /></label><button onClick={locate} disabled={locating} className="min-h-11 rounded-xl bg-ink px-5 text-[14px] font-bold text-white disabled:opacity-60">{locating ? "위치 확인 중" : "내 주변 전통시장 찾기"}</button></div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{["전체", ...MARKET_REGIONS].map((r) => <button key={r} onClick={() => setRegion(r)} className={["min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold", region === r ? "bg-free text-white" : "border border-line bg-white text-ink-soft"].join(" ")}>{r}</button>)}</div>
    <div className="mt-3 flex flex-wrap gap-2"><Toggle active={parking} onClick={() => setParking(!parking)} label="주차 가능" /><Toggle active={giftcard} onClick={() => setGiftcard(!giftcard)} label="상품권 사용" /><Toggle active={permanent} onClick={() => setPermanent(!permanent)} label="상설시장" />{position && [5, 10, 30].map((n) => <Toggle key={n} active={nearby === n} onClick={() => setNearby(nearby === n ? null : n)} label={n + "km 이내"} />)}</div>
    <p className="mt-5 text-[13px] text-ink-soft">{position ? "현재 위치에서 가까운 순서로 보여드려요." : "전국 전통시장 " + list.length.toLocaleString() + "곳"}</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.slice(0, 120).map((m: TraditionalMarket & { distance: number }) => <article key={m.id} className="rounded-xl border border-line bg-white p-4"><div className="flex items-start justify-between gap-3"><h2 className="text-[16px] font-extrabold text-ink">{m.name}</h2><span className="shrink-0 text-[12px] font-bold text-free">{m.region || "전국"}</span></div>{m.category && <p className="mt-1 text-[12px] text-ink-soft">{m.category}</p>}{m.address && <p className="mt-3 text-[13px] leading-5 text-ink-soft">{m.address}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{m.hasParking === true && <Badge text="주차 가능" />}{m.giftcard === true && <Badge text="상품권 사용" />}{m.openingType && <Badge text={m.openingType} />}{position && <Badge text={(m.distance < 1 ? Math.round(m.distance * 1000) + "m" : m.distance.toFixed(1) + "km")} />}</div>{m.items && <p className="mt-3 line-clamp-2 text-[12px] text-ink-faint">취급품목 · {m.items}</p>}{m.phone && <a href={"tel:" + m.phone} className="mt-3 inline-block text-[12px] font-bold text-free">전화 걸기 →</a>}</article>)}</div>
    {!list.length && <div className="border-t border-line py-14 text-center text-[14px] text-ink-soft">조건에 맞는 전통시장이 없어요. 지역이나 필터를 바꿔보세요.</div>}
    {list.length > 120 && <p className="mt-6 text-center text-[12px] text-ink-faint">상위 120곳 표시 · 검색과 필터로 범위를 좁혀보세요.</p>}
    <nav className="mt-9 border-t border-line pt-5"><p className="text-[13px] font-black text-ink">함께 찾아보기</p><div className="mt-2 flex flex-wrap gap-3 text-[13px] font-bold text-free"><Link href="/season">가을나들이</Link><Link href="/month/9">9월에 뭐하지</Link><Link href="/food">전통시장 먹거리와 맛집탐방</Link></div></nav>
  </div></div>;
}
function Toggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button onClick={onClick} className={["min-h-9 rounded-full px-3 text-[12px] font-bold", active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft"].join(" ")}>{label}</button>; }
function Badge({ text }: { text: string }) { return <span className="rounded-md bg-tint px-2 py-1 text-[11px] font-bold text-ink-soft">{text}</span>; }
