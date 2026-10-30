import type { Metadata } from 'next';
import {Suspense} from 'react';
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
  const cards=courses.map(({id,slug,title,area,duration,intro,image,stops})=>({id,slug,title,area,duration,intro,image,stops:stops.map(({name})=>({name}))}));
  return <>
    <Band tone="tint" innerClassName="py-4"><h1 className="text-[24px] font-black tracking-[-0.02em] text-ink sm:text-[30px]">❄️ <span className="text-free">겨울 여행지</span></h1><p className="mt-1 max-w-[760px] text-[14px] leading-[1.7] text-ink-soft">지역과 일정을 골라 겨울 당일치기·1박 2일 코스를 찾아보세요. 운영일·날씨·이동 여건은 출발 전 공식 안내를 확인해 주세요.</p></Band>
    <Suspense fallback={null}><WinterCourseBrowser courses={cards} /></Suspense>
  </>;
}
