"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

interface NearItem { id: string; title: string; area: string; image: string; url: string; dist: string }

// 내 주변 — 위치 기반 근처 나들이/캠핑 + 지역 선택 폴백
export default function NearFinder() {
  const router = useRouter();
  const enc = encodeURIComponent;
  const slug = (r: string) => (SIDO_SLUG as Record<string, string>)[r] || "";
  const [kind, setKind] = useState<"nadeuli" | "camping">("nadeuli");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [items, setItems] = useState<NearItem[]>([]);

  function locate() {
    if (!navigator.geolocation) return setStatus("denied");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`/api/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          const j = await r.json();
          setItems(kind === "camping" ? j.camps || [] : j.places || []);
          setStatus("done");
        } catch { setStatus("denied"); }
      },
      () => setStatus("denied"),
      { timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(["nadeuli", "camping"] as const).map((k) => (
          <button key={k} onClick={() => { setKind(k); setStatus("idle"); setItems([]); }}
            className={["min-h-[44px] rounded-full px-5 text-[14px] font-bold transition", kind === k ? "bg-free text-white" : "border border-line bg-white text-ink-soft"].join(" ")}>
            {k === "nadeuli" ? "🏞️ 나들이" : "⛺ 캠핑장"}
          </button>
        ))}
        <button onClick={locate} disabled={status === "loading"}
          className="ml-auto min-h-[44px] rounded-full bg-ink px-5 text-[14px] font-bold text-white transition hover:bg-black disabled:opacity-60">
          {status === "loading" ? "찾는 중…" : "📍 내 위치로 찾기"}
        </button>
      </div>

      {status === "denied" && <p className="mb-3 text-[14px] text-ink-soft">위치를 쓸 수 없어요. 아래에서 지역을 골라주세요.</p>}

      {status === "done" && (
        items.length ? (
          <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it) => (
              <Link key={it.id} href={it.url} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
                  {it.image ? <Image src={it.image} alt={it.title} fill sizes="(max-width:640px) 50vw, 240px" className="object-cover transition group-hover:scale-105" unoptimized /> : <div className="flex h-full items-center justify-center text-xl text-ink-faint">📍</div>}
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">{it.dist}</span>
                </div>
                <h3 className="mt-1.5 line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{it.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{it.area}</p>
              </Link>
            ))}
          </div>
        ) : <p className="mb-3 text-[14px] text-ink-faint">주변 결과를 찾지 못했어요. 지역을 골라보세요.</p>
      )}

      <div className="mt-2 text-[13px] font-bold text-ink-faint">지역으로 찾기</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {SIDO_LIST.map((r) => (
          <button key={r} onClick={() => router.push(kind === "camping" ? `/camping?area=${enc(r)}` : `/places/${slug(r)}`)}
            className="min-h-[44px] rounded-full border border-line bg-white px-4 text-[14px] font-bold text-ink-soft transition hover:border-free hover:bg-tint hover:text-free">
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
