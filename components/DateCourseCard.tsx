import Image from "next/image";
import Link from "next/link";
import { distLabel, type DateCourse } from "@/lib/dateCourses";

/** 카페데이트 코스 카드 — 카페 사진 + 세 지점 요약 */
export default function DateCourseCard({ course }: { course: DateCourse }) {
  return (
    <Link href={`/date/c/${course.id}`} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition hover:-translate-y-0.5 hover:shadow-cardhover">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {course.image ? (
          <Image src={course.image} alt={`${course.cafe.title} 카페데이트 코스`} fill sizes="(max-width:640px) 100vw, 380px" className="object-cover transition group-hover:scale-105" loading="lazy" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-ink-faint">☕</div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-free px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
          도보 {course.walkMin}분
        </span>
      </div>
      <div className="px-3.5 pb-3.5 pt-3">
        <p className="text-[12px] font-bold text-free">{course.area} {course.city}</p>
        <h3 className="mt-0.5 line-clamp-1 text-[15.5px] font-extrabold text-ink group-hover:text-free">
          {course.cafe.title}
        </h3>
        <ol className="mt-2 space-y-1 text-[12.5px] text-ink-soft">
          <li className="flex gap-1.5"><span className="shrink-0">☕</span><span className="line-clamp-1">{course.cafe.title}</span></li>
          <li className="flex gap-1.5"><span className="shrink-0">🌳</span><span className="line-clamp-1">{course.park.title} <span className="text-ink-faint">{distLabel(course.park.distKm)}</span></span></li>
          <li className="flex gap-1.5"><span className="shrink-0">🍽</span><span className="line-clamp-1">{course.food.title} <span className="text-ink-faint">{distLabel(course.food.distKm)}</span></span></li>
        </ol>
      </div>
    </Link>
  );
}
