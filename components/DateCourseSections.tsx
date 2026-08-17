// components/DateCourseSections.tsx
// 카페데이트 코스 목록을 "🚶 걸어서 데이트 / 🚗 차량 이동 데이트" 두 줄로 나눠 보여준다.
// 도시·지역 페이지에서 공통으로 사용(서버 렌더 → SEO 친화).

import ScrollRail from "@/components/ScrollRail";
import DateCourseCard from "@/components/DateCourseCard";
import { isWalkCourse, type DateCourse } from "@/lib/dateCourses";

function Sec({ emoji, title, desc, courses, mode }: {
  emoji: string; title: string; desc: string; courses: DateCourse[]; mode: "walk" | "drive";
}) {
  if (!courses.length) return null;
  return (
    <section>
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">{emoji} {title}</h2>
        <span className="text-[13.5px] font-bold text-free">{courses.length}곳</span>
      </div>
      <p className="mb-3 text-[12.5px] text-ink-faint">{desc} · 옆으로 넘겨보세요</p>
      <ScrollRail ariaLabel={title}>
        {courses.map((c) => <DateCourseCard key={c.id} course={c} rail mode={mode} />)}
      </ScrollRail>
    </section>
  );
}

export default function DateCourseSections({ courses }: { courses: DateCourse[] }) {
  const walk = courses.filter(isWalkCourse);
  const drive = courses.filter((c) => !isWalkCourse(c));
  if (!walk.length && !drive.length) return null;
  return (
    <div className="space-y-9">
      <Sec emoji="🚶" title="걸어서 데이트" desc="카페·공원·맛집이 걸어서 이어지는 코스" courses={walk} mode="walk" />
      <Sec emoji="🚗" title="차량 이동 데이트" desc="조금 떨어져 있어 차로 움직이면 편한 코스" courses={drive} mode="drive" />
    </div>
  );
}
