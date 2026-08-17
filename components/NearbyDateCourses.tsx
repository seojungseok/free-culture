"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CourseGeo } from "@/lib/dateCourses";

/**
 * 내 위치 기반 카페데이트 코스.
 * 버튼을 누르기 전에는 아무 코스도 보여주지 않는다(평상시 화면은 지역 선택 위주).
 * 버튼을 누르면 브라우저에서 현재 위치와의 거리를 계산해,
 *  - 🚶 걸어서 도는 코스
 *  - 🚗 차로 도는 코스
 * 두 그룹으로 나눠 가까운 순으로 넉넉히 보여준다. (서버 호출 0, 위치는 저장하지 않음)
 */
type Ranked = CourseGeo & { away: number };

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, t = Math.PI / 180;
  const dLat = (bLat - aLat) * t, dLng = (bLng - aLng) * t;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * t) * Math.cos(bLat * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const kmLabel = (km: number) => (km < 1 ? `${Math.round(km * 10) * 100}m` : `${km.toFixed(1)}km`);

const PER_GROUP = 15; // 그룹당 최대 노출 수 (항목 넉넉하게)

export default function NearbyDateCourses({ courses }: { courses: CourseGeo[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [walk, setWalk] = useState<Ranked[]>([]);
  const [drive, setDrive] = useState<Ranked[]>([]);

  function locate() {
    if (!navigator.geolocation) return setStatus("denied");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const ranked = courses
          .filter((c) => c.lat && c.lng)
          .map((c) => ({ ...c, away: distanceKm(latitude, longitude, c.lat, c.lng) }))
          .sort((a, b) => a.away - b.away);
        setWalk(ranked.filter((c) => c.walk).slice(0, PER_GROUP));
        setDrive(ranked.filter((c) => !c.walk).slice(0, PER_GROUP));
        setStatus("done");
      },
      () => setStatus("denied"),
      { timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div>
      <button
        onClick={locate}
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-[15px] font-bold text-white transition hover:bg-black disabled:opacity-60"
      >
        {status === "loading" ? "내 주변 코스 찾는 중…" : "📍 내 위치로 가까운 코스 찾기"}
      </button>

      {status === "idle" && (
        <p className="mt-2 text-center text-[12.5px] text-ink-faint">
          버튼을 누르면 지금 있는 곳에서 가까운 코스를 걸어서·차로 나눠 보여드려요
        </p>
      )}

      {status === "denied" && (
        <p className="mt-2 text-center text-[13px] text-ink-soft">
          위치를 사용할 수 없어요. 아래에서 지역을 골라 코스를 찾아보세요.
        </p>
      )}

      {status === "done" && (
        <div className="mt-6 space-y-8">
          {walk.length === 0 && drive.length === 0 && (
            <p className="text-center text-[13.5px] text-ink-faint">주변에서 코스를 찾지 못했어요. 아래에서 지역을 골라보세요.</p>
          )}
          {walk.length > 0 && <Group title="🚶 걸어서 도는 코스" desc="세 곳이 걸어서 이어지는 코스" items={walk} />}
          {drive.length > 0 && <Group title="🚗 차로 도는 코스" desc="조금 떨어져 있어 차로 움직이면 편한 코스" items={drive} />}
        </div>
      )}
    </div>
  );
}

function Group({ title, desc, items }: { title: string; desc: string; items: Ranked[] }) {
  return (
    <section>
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">{title}</h2>
        <span className="text-[13.5px] font-bold text-free">{items.length}곳</span>
      </div>
      <p className="mb-3 text-[12.5px] text-ink-faint">{desc} · 가까운 순</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
        {items.map((c) => (
          <Link key={c.id} href={`/date/c/${c.id}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
              {c.image ? (
                <Image src={c.image} alt={`${c.title} 카페데이트 코스`} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition group-hover:scale-105" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-ink-faint">☕</div>
              )}
              <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {kmLabel(c.away)}
              </span>
            </div>
            <h3 className="mt-1.5 line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{c.title}</h3>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">🌳 {c.park}</p>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">🍽 {c.food}</p>
            <p className="mt-1 text-[11.5px] text-ink-faint">{c.city} · 총 {kmLabel(c.totalKm)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
