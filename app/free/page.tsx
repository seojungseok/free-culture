import type { Metadata } from "next";
import { getFree } from "@/lib/data";
import CollectionView from "@/components/CollectionView";
import { addDaysYmd, todayYmd } from "@/lib/dates";
import PosterCard from "@/components/PosterCard";

export const metadata: Metadata = {
  title: "전국 무료 문화행사: 오늘 진행 중·곧 열리는 체험·전시·공연",
  description:
    "오늘 진행 중인 무료 전시·공연과 앞으로 30일 안에 열리는 무료 문화행사를 확인하세요. 체험 프로그램의 일정·장소·사전 신청 조건을 안내합니다.",
  alternates: { canonical: "/free" },
};

export default function FreePage() {
  // 완전 무료 + 조건부 무료 포함
  const today = todayYmd();
  const events = getFree(true).filter((event) => event.startDate <= today && event.endDate >= today);
  const upcoming = getFree(true).filter(event => event.startDate > today && event.startDate <= addDaysYmd(today, 30)).slice(0, 12);
  return (
    <CollectionView
      title={
        <>
        <span className="text-free">무료</span> 문화행사
        </>
      }
      subtitle={`오늘 진행 중인 무료·일부 무료 행사 ${events.length.toLocaleString()}건과 앞으로 열릴 행사를 구분해 안내합니다. 참여 대상과 예약 조건은 상세 페이지에서 확인하세요.`}
      events={events}
      hidePriceFilter
    >
      {upcoming.length > 0 && <section aria-labelledby="upcoming-free-title" className="mb-10">
        <h2 id="upcoming-free-title" className="mb-2 text-xl font-extrabold">곧 열리는 무료 행사</h2>
        <p className="mb-5 text-sm text-ink-soft">앞으로 30일 안에 시작하는 행사입니다. 사전 신청이 필요한 프로그램은 마감 시간을 확인하세요.</p>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">{upcoming.map(event => <PosterCard key={event.id} ev={event} />)}</div>
      </section>}
      <h2 className="mb-4 text-xl font-extrabold">오늘 진행 중인 무료 행사</h2>
    </CollectionView>
  );
}
