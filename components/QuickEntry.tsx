"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/classify";

type Icon = { key: string; emoji: string; label: string; href: (region: string) => string };

export default function QuickEntry({ seasonQuery, seasonLabel, seasonEmoji }: { seasonQuery: string; seasonLabel: string; seasonEmoji: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const slug = (r: string) => (SIDO_SLUG as Record<string, string>)[r] || "";
  const enc = encodeURIComponent;

  const icons: Icon[] = [
    { key: "free", emoji: "🆓", label: "오늘 무료", href: (r) => (r ? `/region/${slug(r)}` : "/free") },
    { key: "kid", emoji: "👶", label: "아이랑", href: (r) => (r ? `/places/${slug(r)}?who=kid` : "/kids") },
    { key: "pet", emoji: "🐶", label: "반려동물 캠핑", href: (r) => `/camping?pet=1${r ? `&area=${enc(r)}` : ""}` },
    { key: "date", emoji: "💑", label: "데이트", href: (r) => (r ? `/search?q=${enc(`${r} 전시`)}` : "/genre/exhibition") },
    { key: "glamp", emoji: "🏕️", label: "글램핑", href: (r) => `/camping?type=${enc("글램핑")}${r ? `&area=${enc(r)}` : ""}` },
    { key: "season", emoji: seasonEmoji, label: `${seasonLabel} 명소`, href: (r) => `/search?q=${enc(`${r ? `${r} ` : ""}${seasonQuery}`)}` },
  ];
  const active = icons.find((i) => i.key === open);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {icons.map((ic) => (
          <button key={ic.key} onClick={() => setOpen(open === ic.key ? null : ic.key)}
            className={["flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition", open === ic.key ? "border-free bg-tint" : "border-line bg-white hover:border-free/40"].join(" ")}>
            <span className="text-[26px] leading-none">{ic.emoji}</span>
            <span className="text-[12.5px] font-bold text-ink-soft">{ic.label}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-2.5 rounded-2xl border border-free/30 bg-white p-3.5 shadow-card">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink">
            <span>{active.emoji} {active.label}</span>
            <span className="text-ink-faint">— 지역을 골라주세요</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <RegionChip label="전국" onClick={() => router.push(active.href(""))} />
            {SIDO_LIST.map((r) => (
              <RegionChip key={r} label={r} onClick={() => router.push(active.href(r))} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RegionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-bold text-ink-soft transition hover:border-free hover:bg-tint hover:text-free">
      {label}
    </button>
  );
}
