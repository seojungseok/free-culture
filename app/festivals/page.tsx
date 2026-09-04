import type { Metadata } from "next";
import FestivalBrowser from "@/components/FestivalBrowser";
import { SITE } from "@/lib/site";
import { getAllFestivals } from "@/lib/festivals";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "전국 축제 일정 | 지역별 축제·가볼만한곳",
  description: "전국 축제 일정을 지역과 기간별로 찾아보세요. 진행 중인 축제, 예정 축제, 축제 장소와 공식 홈페이지를 한눈에 확인할 수 있습니다.",
  keywords: ["전국 축제", "축제 일정", "지역 축제", "가을 축제", "축제 가볼만한곳"],
  alternates: { canonical: `${SITE.url.replace(/\/$/, "")}/festivals` },
};

export default async function FestivalsPage({ searchParams }: { searchParams: Promise<{ region?: string; query?: string }> }) {
  const festivals = getAllFestivals();
  const params = await searchParams;
  return <main className="min-h-screen bg-white pb-14"><section className="border-b border-line bg-[#f1f8f3] px-5 py-9 sm:py-12"><div className="mx-auto max-w-[1180px]"><p className="text-[13px] font-black tracking-wide text-free">FESTIVAL GUIDE</p><h1 className="mt-2 text-[30px] font-black tracking-tight text-ink sm:text-[42px]">전국 축제 일정</h1><p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">이번 주말 어디로 갈지 고민될 때, 지역 축제와 계절 행사를 일정에 맞춰 찾아보세요. 축제 장소와 공식 안내를 함께 확인할 수 있습니다.</p></div></section><div className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-6 lg:px-8"><FestivalBrowser festivals={festivals} initialRegion={params.region} initialQuery={params.query} /><nav aria-label="관련 여행 정보" className="mt-10 border-t border-line pt-5 text-[13px] font-bold text-ink-soft"><span className="mr-3 text-ink">함께 찾는 여행 정보</span><a href="/events" className="mr-4 hover:text-free">문화행사</a><a href="/course" className="mr-4 hover:text-free">여행코스</a><a href="/season" className="hover:text-free">가을나들이</a></nav></div></main>;
}
