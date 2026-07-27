"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

type Key = "loc" | "free" | "season" | "date";
interface NearItem { id: string; title: string; area: string; image: string; url: string; dist: string }

export default function QuickEntry({ seasonLabel, seasonEmoji, seasonTerms, dateThemes }: { seasonLabel: string; seasonEmoji: string; seasonTerms: string[]; dateThemes: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<Key | null>(null);

  const entries: { key: Key; emoji: string; label: string }[] = [
    { key: "loc", emoji: "📍", label: "내 위치로 찾기" },
    { key: "free", emoji: "🆓", label: "오늘의 무료" },
    { key: "season", emoji: seasonEmoji, label: `${seasonLabel} 명소` },
    { key: "date", emoji: "💑", label: "데이트" },
  ];
  const enc = encodeURIComponent;
  const slug = (r: string) => (SIDO_SLUG as Record<string, string>)[r] || "";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {entries.map((e) => (
          <button key={e.key} onClick={() => setOpen(open === e.key ? null : e.key)}
            className={["flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 text-center transition", open === e.key ? "border-free bg-tint" : "border-line bg-white hover:border-free/40"].join(" ")}>
            <span className="text-[30px] leading-none">{e.emoji}</span>
            <span className="text-[13.5px] font-bold text-ink-soft">{e.label}</span>
          </button>
        ))}
      </div>

      {open === "loc" && <LocPanel enc={enc} slug={slug} />}
      {open === "free" && (
        <Panel title="🆓 오늘의 무료 문화행사" hint="지역을 고르면 그 지역 문화행사로 가요">
          <RegionRow onPick={(r) => router.push(r ? `/region/${slug(r)}` : "/free")} />
        </Panel>
      )}
      {open === "season" && (
        <ThemePanel title={`${seasonEmoji} ${seasonLabel} 명소`} hint="테마를 고르고(여러 개 가능) 지역을 누르세요 · 계절은 자동으로 바뀌어요"
          themes={seasonTerms} onGo={(region, terms) => {
            const q = [region, ...(terms.length ? terms : [seasonTerms[0]])].filter(Boolean).join(" ");
            router.push(`/search?q=${enc(q)}`);
          }} />
      )}
      {open === "date" && (
        <ThemePanel title="💑 데이트" hint="테마를 고르고(여러 개 가능) 지역을 누르세요"
          themes={dateThemes} onGo={(region, terms) => {
            const q = [region, ...(terms.length ? terms : [dateThemes[0]])].filter(Boolean).join(" ");
            router.push(`/search?q=${enc(q)}`);
          }} />
      )}
    </div>
  );
}

// 📍 내 위치: 나들이/캠핑 선택 → 위치 or 지역
function LocPanel({ enc, slug }: { enc: (s: string) => string; slug: (r: string) => string }) {
  const router = useRouter();
  const [kind, setKind] = useState<"nadeuli" | "camping">("nadeuli");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [items, setItems] = useState<NearItem[]>([]);

  function locate() {
    if (!navigator.geolocation) return setStatus("denied");
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`/api/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
        const j = await r.json();
        setItems(kind === "camping" ? j.camps || [] : j.places || []);
        setStatus("done");
      } catch { setStatus("denied"); }
    }, () => setStatus("denied"), { timeout: 8000 });
  }

  return (
    <Panel title="📍 내 위치로 찾기" hint="종류를 고르고, 위치를 켜거나 지역을 누르세요 · 위치는 저장하지 않아요">
      <div className="mb-2.5 flex gap-2">
        {(["nadeuli", "camping"] as const).map((k) => (
          <button key={k} onClick={() => { setKind(k); setStatus("idle"); }}
            className={["rounded-full px-4 py-2 text-[14px] font-bold transition", kind === k ? "bg-free text-white" : "border border-line bg-white text-ink-soft"].join(" ")}>
            {k === "nadeuli" ? "🏞️ 나들이" : "⛺ 캠핑장"}
          </button>
        ))}
        <button onClick={locate} disabled={status === "loading"} className="ml-auto rounded-full bg-ink px-4 py-2 text-[14px] font-bold text-white transition hover:bg-black disabled:opacity-60">
          {status === "loading" ? "찾는 중…" : "📍 내 위치로"}
        </button>
      </div>
      {status === "denied" && <p className="mb-2 text-[13px] text-ink-soft">위치를 쓸 수 없어요. 아래에서 지역을 골라주세요.</p>}
      {status === "done" && (
        items.length ? (
          <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
            {items.map((it) => (
              <Link key={it.id} href={it.url} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/[0.04]">
                  {it.image ? <Image src={it.image} alt={it.title} fill sizes="200px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xl text-ink-faint">📍</div>}
                  <span className="absolute right-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{it.dist}</span>
                </div>
                <h4 className="mt-1.5 line-clamp-1 text-[13px] font-bold text-ink group-hover:text-free">{it.title}</h4>
              </Link>
            ))}
          </div>
        ) : <p className="mb-2 text-[13px] text-ink-faint">주변 결과를 찾지 못했어요.</p>
      )}
      <RegionRow onPick={(r) => router.push(kind === "camping" ? `/camping${r ? `?area=${enc(r)}` : ""}` : r ? `/places/${slug(r)}` : "/places")} />
    </Panel>
  );
}

// 테마(다중) + 지역 → 검색
function ThemePanel({ title, hint, themes, onGo }: { title: string; hint: string; themes: string[]; onGo: (region: string, terms: string[]) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  return (
    <Panel title={title} hint={hint}>
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {themes.map((t) => (
          <button key={t} onClick={() => toggle(t)}
            className={["rounded-full px-3.5 py-2 text-[13.5px] font-bold transition", sel.includes(t) ? "bg-free text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free"].join(" ")}>
            {t}
          </button>
        ))}
      </div>
      <div className="text-[12px] font-bold text-ink-faint">지역 선택 →</div>
      <RegionRow onPick={(r) => onGo(r, sel)} />
    </Panel>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5 rounded-2xl border border-free/30 bg-white p-3.5 shadow-card">
      <div className="mb-2">
        <div className="text-[14px] font-extrabold text-ink">{title}</div>
        <div className="text-[12px] text-ink-faint">{hint}</div>
      </div>
      {children}
    </div>
  );
}
function RegionRow({ onPick }: { onPick: (region: string) => void }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      <RChip label="전국" onClick={() => onPick("")} />
      {SIDO_LIST.map((r) => <RChip key={r} label={r} onClick={() => onPick(r)} />)}
    </div>
  );
}
function RChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-free hover:bg-tint hover:text-free">{label}</button>
  );
}
