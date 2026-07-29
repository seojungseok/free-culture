import Image from "next/image";
import Link from "next/link";
import { foodCatLabel, type Restaurant } from "@/lib/food";

/** 음식점 카드 — /food, /food/[area], /food/[area]/[cat] 공용. 상세(/places/spot/[id])로 링크 */
export default function FoodCard({ r }: { r: Restaurant }) {
  const gu = (r.addr.match(/[가-힣]{2,}(?:구|군|시)/) || [])[0] || "";
  return (
    <Link href={`/places/spot/${r.id}`} className="group block" aria-label={`${r.title} 상세 보기`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
        {r.image ? (
          <Image src={r.image} alt={r.title} fill sizes="(max-width:640px) 50vw, 220px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-ink-faint">🍽️</div>
        )}
        <div className="absolute left-1.5 top-1.5">
          <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">{foodCatLabel(r.cat3)}</span>
        </div>
      </div>
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">{r.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{[r.area, gu].filter(Boolean).join(" · ")}</p>
        {r.phone && (
          <p className="mt-0.5 line-clamp-1 text-[11.5px] font-semibold text-ink-soft">☎ {r.phone}</p>
        )}
      </div>
    </Link>
  );
}
