import type { Metadata } from "next";
import Link from "next/link";
import Planner from "@/components/Planner";
import { plannerOptions } from "@/lib/plannerData";
import { todayYmd,weekendRangeYmd,ymdToDash,addDaysYmd } from "@/lib/dates";
export const revalidate = 3600;
export const metadata:Metadata={title:"지역·날짜별 맞춤 나들이 추천",description:"지역과 날짜, 여유 시간에 맞는 방문 후보를 고르고 이 브라우저 보관함에 저장하세요.",robots:{index:false,follow:true},alternates:{canonical:"/plan"}};
export default function Page(){const today=todayYmd();return <div className="mx-auto max-w-6xl px-5 py-8"><nav aria-label="경로" className="mb-4 text-sm"><Link href="/">홈</Link> / 맞춤 추천</nav><h1 className="text-3xl font-black">내 조건으로 나들이 고르기</h1><p className="mb-6 mt-3 text-sm leading-6 text-ink-soft">갈 곳을 먼저 정하고, 가까운 한 곳을 더해 보세요. 지역별로 추린 공개 데이터에서 최대 3가지 후보를 추천합니다.</p><Planner options={plannerOptions()} initialDate={ymdToDash(weekendRangeYmd().start)} minDate={ymdToDash(today)} maxDate={ymdToDash(addDaysYmd(today,60))}/></div>;}
