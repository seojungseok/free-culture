import Image from "next/image";
import Link from "next/link";
import type { TourSpot } from "@/lib/tour";
import { tourTypeLabel } from "@/lib/tour";

export default function TourCard({ spot }: { spot: TourSpot }) {
  return (
    <Link href={`/places/spot/${spot.id}`} className="group block" aria-label={`${spot.title} 상세 보기`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-cardhover">
        {spot.image ? (
          <Image
            src={spot.image}
            alt={spot.title}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 220px"
            className="object-cover transition group-hover:scale-105"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint">🏞️</div>
        )}
        <div className="absolute left-1.5 top-1.5">
          <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {tourTypeLabel(spot.type)}
          </span>
        </div>
      </div>
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-free">
          {spot.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{spot.addr}</p>
        {spot.overview ? (
          <p className="mt-1 line-clamp-2 text-[12px] leading-[1.5] text-ink-soft">
            {spot.overview}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
