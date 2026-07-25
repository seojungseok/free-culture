import Image from "next/image";
import type { TourSpot } from "@/lib/tour";
import { tourTypeLabel } from "@/lib/tour";

export default function TourCard({ spot }: { spot: TourSpot }) {
  const hasMap = Boolean(spot.mapx && spot.mapy);
  const mapUrl = hasMap
    ? `https://map.kakao.com/link/map/${encodeURIComponent(spot.title)},${spot.mapy},${spot.mapx}`
    : undefined;

  const inner = (
    <>
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
        {hasMap && (
          <div className="absolute bottom-1.5 right-1.5">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink-soft shadow-sm">
              지도 ↗
            </span>
          </div>
        )}
      </div>
      <div className="px-0.5 pb-1 pt-2">
        <h3 className="line-clamp-1 text-[14px] font-bold text-ink group-hover:text-black">
          {spot.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">{spot.addr}</p>
      </div>
    </>
  );

  return mapUrl ? (
    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="group block" aria-label={`${spot.title} 지도 보기`}>
      {inner}
    </a>
  ) : (
    <div className="group block">{inner}</div>
  );
}
