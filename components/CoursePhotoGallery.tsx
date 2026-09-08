import Image from "next/image";
import type { GalleryPhoto } from "@/lib/photoGallery";

const monthLabel = (month: string) => {
  const value = String(month || "");
  const monthNumber=Number(value.slice(4,6));
  return value.length >= 6 && monthNumber>=1 && monthNumber<=12 ? `${monthNumber}월 촬영` : "촬영 월 미제공";
};

export default function CoursePhotoGallery({ photos, id = 'course-photo-gallery', title = '📷 관광사진으로 미리 보는 코스', headingLevel = 2 }: { photos: GalleryPhoto[]; id?: string; title?: string; headingLevel?: 2 | 3 }) {
  if (!photos.length) return null;
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section className="mt-9" aria-labelledby={id}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <Heading id={id} className="text-[19px] font-extrabold tracking-tight text-ink sm:text-[20px]">{title}</Heading>
          <p className="mt-1 text-[13px] text-ink-faint">한국관광공사 사진으로 여행지 분위기와 계절 풍경을 먼저 확인해 보세요.</p>
        </div>
        <span className="shrink-0 text-[12px] font-bold text-ink-faint">{photos.length}장</span>
      </div>
      <div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1 sm:grid-cols-2' : photos.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {photos.map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
              <Image src={photo.image} alt={`${photo.title} 관광사진`} fill sizes="(max-width:640px) 50vw, 200px" className="object-cover" loading="lazy" unoptimized />
            </div>
            <figcaption className="px-2.5 py-2">
              <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">{photo.title}</p>
              <p className="mt-1 line-clamp-1 text-[11px] text-ink-faint">{photo.location} · {monthLabel(photo.month)}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-2 text-right text-[11px] text-ink-faint">사진 제공: 한국관광공사 · 현재 계절·현장 모습과 다를 수 있습니다.</p>
    </section>
  );
}
