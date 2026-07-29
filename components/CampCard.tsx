import Image from "next/image";
import Link from "next/link";
import type { Camp } from "@/lib/camping";

const FAC_ICON: Record<string, string> = { 전기: "⚡", 샤워실: "🚿", 화장실: "🚻", 와이파이: "📶", 온수: "♨️", 마트: "🛒" };

export default function CampCard({ camp }: { camp: Camp }) {
  const facs = Object.entries(camp.facilities).filter(([, v]) => v).map(([k]) => k);
  return (
    <Link href={`/camping/${camp.id}`} className="group block" aria-label={`${camp.name} 캠핑장 정보`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
        {camp.image ? (
          <Image src={camp.image} alt={camp.name} fill sizes="(max-width:640px) 50vw, 220px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-freelight to-tint">
            <span className="text-3xl opacity-80" aria-hidden>⛺</span>
            <span className="text-[10.5px] font-semibold text-freedark/70">사진 준비중</span>
          </div>
        )}
        {camp.types[0] && (
          <div className="absolute left-1.5 top-1.5">
            <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">⛺ {camp.types[0]}</span>
          </div>
        )}
        {camp.pet && (
          <div className="absolute right-1.5 top-1.5">
            <span className="rounded-md bg-free px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">🐾 반려동물</span>
          </div>
        )}
      </div>
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{camp.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{[camp.area, camp.sigungu].filter(Boolean).join(" · ")}</p>
        {facs.length > 0 && (
          <p className="mt-0.5 text-[12px] text-ink-dim">{facs.slice(0, 5).map((f) => FAC_ICON[f]).join(" ")}</p>
        )}
      </div>
    </Link>
  );
}
