"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CourseGeo } from "@/lib/dateCourses";

/**
 * 내 위치에서 가까운 카페데이트 코스.
 * 좌표 목록(CourseGeo[])을 서버에서 받아, 버튼을 누르면 브라우저에서
 * 현재 위치와의 거리를 계산해 가까운 순으로 보여준다. (서버 호출 0, 위치는 저장 안 함)
 */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, t = Math.PI / 180;
  const dLat = (bLat - aLat) * t, dLng = (bLng - aLng) * t;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * t) * Math.cos(bLat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const kmLabel = (km: number) => (km < 1 ? `${Math.round(km * 10) * 100}m` : `${km.toFixed(1)}km`);

export default function NearbyDateCourses({ courses, max = 6 }: { courses: CourseGeo[]; max?: number }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [items, setItems] = useState<(CourseGeo & { away: number })[]>([]);

  function locate() {
    if (!navigator.geolocation) return setStatus("denied");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const ranked = courses
          .filter((c) => c.lat && c.lng)
          .map((c) => ({ ...c, away: distanceKm(latitude, longitude, c.lat, c.lng) }))
          .sort((a, b) => a.away - b.away)
          .slice(0, max);
        setItems(ranked);
        setStatus("done");
      },
      () => setStatus("denied"),
      { timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-extrabold text-ink">📍 내 위치에서 가까운 코스</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-faint">지금 있는 곳에서 가장 가까운 카페데이트 코스를 찾아드려요</p>
        </div>
        <button
          onClick={locate}
          disabled={status === "loading"}
          className="min-h-[44px] shrink-0 rounded-full bg-ink px-5 text-[14px] font-bold text-white transition hover:bg-black disabled:opacity-60"
        >
          {status === "loading" ? "찾는 중…" : "📍 내 위치로 찾기"}
        </button>
      </div>

      {status === "denied" && (
        <p className="mt-3 text-[13.5px] text-ink-soft">
          위치를 사용할 수 없어요. 아래에서 지역을 골라 코스를 찾아보세요.
        </p>
      )}

      {status === "done" &&
        (items.length ? (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
            {items.map((c) => (
              <Link key={c.id} href={`/date/c/${c.id}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
                  {c.image ? (
                    <Image src={c.image} alt={`${c.title} 카페데이트 코스`} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition group-hover:scale-105" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-ink-faint">☕</div>
                  )}
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    내 위치서 {kmLabel(c.away)}
                  </span>
                </div>
                <h3 className="mt-1.5 line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{c.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{c.city} · 코스 총 {kmLabel(c.totalKm)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[13.5px] text-ink-faint">주변에서 코스를 찾지 못했어요. 지역을 골라보세요.</p>
        ))}
    </div>
  );
}
