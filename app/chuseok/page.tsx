import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Band } from "@/components/Band";
import ChuseokBrowser from "@/components/ChuseokBrowser";
import { getChuseokEvents } from "@/lib/chuseok";
import { todayYmd } from "@/lib/dates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "2026 추석 가볼만한곳 · 무료행사 · 아이와 갈 곳 총정리",
  description: "2026 추석 연휴에 가볼 만한 전국 행사와 축제를 한곳에서 확인하세요. 추석 무료행사, 야간 행사, 전통문화 체험을 지역별로 찾아볼 수 있습니다.",
  keywords: ["2026 추석 가볼만한곳", "추석 가볼만한곳", "추석 연휴 가볼만한곳", "추석 무료행사", "추석 행사", "추석 축제", "추석 서울 행사", "추석 경기 행사", "추석 인천 행사", "추석 아이와 가볼만한곳", "추석 아이랑 가볼만한곳", "추석 당일 가볼만한곳", "추석 야간 행사", "추석 전통문화 체험", "명절 가볼만한곳"],
  alternates: { canonical: "/chuseok" },
};

const faq = [
  ["2026 추석 연휴에 아이와 가볼 만한 곳은 어디인가요?", "현재 공식 일정이 확인된 행사 중에서는 남산골한옥마을의 2026 남산골 추석축제를 확인해 볼 수 있습니다. 아이와 함께라면 행사 운영 내용과 체험 가능 여부를 공식 안내에서 다시 확인하세요."],
  ["추석 당일에도 운영하는 행사가 있나요?", "추석 당일 운영 여부는 행사마다 다릅니다. 행사 카드의 공식 안내를 열어 9월 25일 운영 여부와 세부 시간을 확인하세요."],
  ["무료로 즐길 수 있는 추석 행사가 있나요?", "추석 특별관의 무료행사 필터에서 무료 태그가 붙은 행사만 모아볼 수 있습니다. 일정과 무료 범위는 공식 주최기관 안내를 기준으로 합니다."],
  ["서울에서 열리는 추석 행사는 어디서 찾나요?", "지역 필터에서 서울을 선택하면 서울 추석 행사만 확인할 수 있습니다."],
  ["밤에 갈 수 있는 추석 야간행사도 있나요?", "야간행사 필터를 선택하면 야간 태그가 붙은 행사만 볼 수 있습니다. 야간 운영 시간은 공식 안내에서 확인하세요."],
];

export default function ChuseokPage() {
  const events = getChuseokEvents();
  const ended = todayYmd() > "20260930";
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return <>
    <Band tone="panel" innerClassName="py-6 sm:py-8"><h1 className="text-[24px] font-black tracking-tight text-ink sm:text-[32px]">2026 추석 가볼만한곳 · 무료행사 · 아이와 갈 곳 총정리</h1><p className="mt-2 max-w-3xl text-[14px] leading-6 text-ink-soft">2026 추석 연휴에 가볼 만한 전국 행사와 축제를 한곳에서 확인하세요. 서울, 경기, 인천을 비롯한 전국 추석 무료행사와 아이와 함께 가기 좋은 곳, 야간 행사와 전통문화 체험을 지역별로 찾아볼 수 있습니다.</p></Band>
    {ended ? <section className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-6 lg:px-8"><div className="rounded-2xl border border-line bg-panel px-5 py-8 text-center"><h2 className="text-[20px] font-black text-ink">2026 추석 행사가 종료되었습니다.</h2><p className="mt-2 text-[13px] text-ink-soft">현재 진행 중인 가을 행사와 이번 주말 가볼 만한 곳을 확인해보세요.</p><div className="mt-5 flex justify-center gap-3"><Link href="/events" className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white">이번 주 행사 보기</Link><Link href="/season" className="rounded-full bg-tint px-4 py-2 text-[13px] font-bold text-ink">가을나들이 보기</Link></div></div></section> : <Suspense fallback={null}><ChuseokBrowser events={events} /></Suspense>}
    <section className="mx-auto w-full max-w-[1180px] px-5 pb-10 sm:px-6 lg:px-8"><div className="border-t border-line pt-6"><h2 className="text-[20px] font-black text-ink">추석 특별관 이용 안내</h2><p className="mt-2 text-[13px] leading-6 text-ink-soft">추석 행사 일정은 주최기관 사정에 따라 바뀔 수 있습니다. 방문 전 행사 카드의 공식 안내에서 날짜, 운영시간, 예약 여부를 확인하세요. 현재 확인되지 않은 행사는 임의로 등록하지 않습니다.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/events" className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white">이번 주 행사 보기</Link><Link href="/season" className="rounded-full bg-tint px-4 py-2 text-[13px] font-bold text-ink">가을나들이 보기</Link></div></div><div className="mt-8 border-t border-line pt-6"><h2 className="text-[20px] font-black text-ink">추석 행사 자주 묻는 질문</h2><div className="mt-4 space-y-4">{faq.map(([q, a]) => <div key={q}><h3 className="text-[14px] font-extrabold text-ink">Q. {q}</h3><p className="mt-1 text-[13px] leading-6 text-ink-soft">{a}</p></div>)}</div></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
  </>;
}
