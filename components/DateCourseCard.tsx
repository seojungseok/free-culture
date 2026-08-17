import Image from "next/image";
import Link from "next/link";
import { distLabel, walkMinutes, driveMinutes, type DateCourse } from "@/lib/dateCourses";

/**
 * 카페데이트 코스 카드 — 카페 사진 + 세 지점 요약.
 * rail=true면 가로 슬라이드용 고정 폭(모바일 스와이프).
 * mode="walk"|"drive"면 하단에 도보/차량 소요를 표시.
 */
export default function DateCourseCard({
  course,
  rail = false,
  mode = "walk",
}: {
  course: DateCourse;
  rail?: boolean;
  mode?: "walk" | "drive";
}) {
  const moveLabel =
    mode === "drive"
      ? `🚗 차로 약 ${driveMinutes(course.totalKm)}분 · 총 ${distLabel(course.totalKm)}`
      : `🚶 걸어서 약 ${walkMinutes(course.totalKm)}분 · 총 ${distLabel(course.totalKm)}`;
  return (
    <Link
      href={`/date/c/${course.id}`}
      className={[
        "group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-cardhover",
        rail ? "w-[248px] shrink-0 snap-start sm:w-[268px]" : "",
      ].join(" ")}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {course.cafe.image ? (
          <Image src={course.cafe.image} alt={`${course.cafe.title} 카페데이트 코스`} fill sizes="268px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-ink-faint">☕</div>
        )}
      </div>
      <div className="px-3.5 pb-3.5 pt-2.5">
        <p className="text-[11.5px] font-bold text-free">{course.city}</p>
        <h3 className="mt-0.5 line-clamp-1 text-[15px] font-extrabold text-ink group-hover:text-free">
          {course.cafe.title}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-[12.5px] text-ink-soft">🌳 {course.park.title}</p>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-ink-soft">🍽 {course.food.title}</p>
        <p className="mt-1 text-[11.5px] font-semibold text-ink-faint">{moveLabel}</p>
      </div>
    </Link>
  );
}
