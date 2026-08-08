import Image from "next/image";
import Link from "next/link";
import { themeEmoji, durationLabel, type CourseCardData } from "@/lib/courses";

// 아기자기·모바일 우선 코스 카드. 이미지 위 기간 배지 + 테마 이모지 칩.
export default function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/course/c/${course.id}`}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardhover"
      aria-label={`${course.title} 코스 보기`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 340px"
            className="object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-ink-faint">🧭</div>
        )}
        {/* 그라데이션 + 기간 배지 */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-free px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
          {durationLabel(course.duration)}
        </span>
        <span className="absolute bottom-2 right-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
          📍 {course.stopCount}곳
        </span>
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-ink group-hover:text-free">
          {course.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-freedark">
            {course.area}
          </span>
          {(course.themes || []).slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
              {themeEmoji(t)} {t === "바다피서" ? "바다" : t === "문화유적" ? "유적" : t === "자연힐링" ? "자연" : t === "가족체험" ? "가족" : "맛집"}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
