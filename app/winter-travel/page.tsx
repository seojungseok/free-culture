import type { Metadata } from 'next';
import Link from 'next/link';
import { Band } from '@/components/Band';
import WinterCourseBrowser from '@/components/WinterCourseBrowser';
import { getPublicWinterCourses } from '@/lib/winterCourses';

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: '겨울 여행지 추천 — 당일치기·1박 2일 여행코스',
    description: '겨울에 가볼 만한 여행지를 지역과 여행 기간으로 찾아보세요. 당일치기와 1박 2일 방문 순서와 여행 준비 사항을 안내합니다.',
    alternates: { canonical: '/winter-travel' },
    robots: { index: getPublicWinterCourses().length > 0, follow: true },
  };
}

export default function WinterTravelPage() {
  const courses = getPublicWinterCourses();
  return <>
    <Band tone="tint" innerClassName="py-8 sm:py-10"><p className="text-sm font-bold text-brandblue">계절 여행</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">겨울 여행지와 여행코스</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">당일치기부터 1박 2일까지, 지역별 방문 순서와 준비할 점을 살펴보세요. 겨울철 운영일과 날씨, 이동 여건은 출발 전에 공식 안내를 확인해 주세요.</p><div className="mt-3 flex flex-wrap gap-x-5"><Link href="/season" className="inline-flex min-h-11 items-center text-sm font-bold text-brandblue">가을나들이 보기 →</Link><Link href="/course" className="inline-flex min-h-11 items-center text-sm font-bold text-brandblue">전체 여행코스 보기 →</Link></div></Band>
    <WinterCourseBrowser courses={courses} />
  </>;
}
