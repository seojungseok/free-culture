import type { Metadata } from "next";
import Link from "next/link";
import SavedTrips from "@/components/SavedTrips";
export const metadata:Metadata={title:"내 보관함",robots:{index:false,follow:true},alternates:{canonical:"/saved"}};
export default function Page(){return <div className="mx-auto max-w-5xl px-5 py-8"><nav aria-label="경로" className="mb-4 text-sm"><Link href="/">홈</Link> / 보관함</nav><h1 className="text-3xl font-black">내 보관함</h1><p className="my-4 text-sm leading-6 text-ink-soft">회원가입 없이 이 브라우저에 최대 100개까지 저장합니다. 다른 기기와 동기화되지 않으며 브라우저 데이터를 지우면 사라집니다. 저장한 행사 날짜와 방문 조건은 출발 전에 다시 확인하세요.</p><SavedTrips/></div>;}
