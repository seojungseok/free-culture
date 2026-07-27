"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Item { id: string; title: string; area: string; image: string; url: string; dist: string }

export default function NearMe() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [places, setPlaces] = useState<Item[]>([]);
  const [camps, setCamps] = useState<Item[]>([]);

  function locate() {
    if (!navigator.geolocation) { setState("denied"); return; }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`/api/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          const j = await r.json();
          setPlaces(j.places || []); setCamps(j.camps || []); setState("done");
        } catch { setState("denied"); }
      },
      () => setState("denied"),
      { timeout: 8000 }
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold text-ink">📍 내 주변 나들이·캠핑</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-faint">위치는 가까운 순 정렬에만 쓰고 저장하지 않아요.</p>
        </div>
        <button onClick={locate} disabled={state === "loading"} className="shrink-0 rounded-full bg-free px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-freedark disabled:opacity-60">
          {state === "loading" ? "찾는 중…" : "내 위치로 찾기"}
        </button>
      </div>

      {state === "denied" && (
        <p className="mt-3 text-[13px] text-ink-soft">위치를 사용할 수 없어요. 위에서 <Link href="/places" className="font-bold text-free underline">지역을 선택</Link>해 둘러보세요.</p>
      )}

      {state === "done" && (
        <div className="mt-4 space-y-4">
          {camps.length > 0 && <NearRow title="⛺ 가까운 캠핑장" items={camps} />}
          {places.length > 0 && <NearRow title="🏞️ 가까운 나들이" items={places} />}
          {camps.length === 0 && places.length === 0 && <p className="text-[13px] text-ink-faint">주변 결과를 찾지 못했어요.</p>}
        </div>
      )}
    </div>
  );
}

function NearRow({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-bold text-ink-soft">{title}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
        {items.map((it) => (
          <Link key={it.id} href={it.url} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/[0.04]">
              {it.image ? <Image src={it.image} alt={it.title} fill sizes="200px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xl text-ink-faint">📍</div>}
              <span className="absolute right-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{it.dist}</span>
            </div>
            <h3 className="mt-1.5 line-clamp-1 text-[13px] font-bold text-ink group-hover:text-free">{it.title}</h3>
            <p className="line-clamp-1 text-[11.5px] text-ink-faint">{it.area}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
