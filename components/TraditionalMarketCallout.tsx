import Link from "next/link";

export default function TraditionalMarketCallout({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <section className="mt-5 rounded-xl border border-[#e6c89b] bg-[#fff8ec] p-5"><h2 className="text-[18px] font-black text-ink">추석에 둘러보기 좋은 전통시장</h2><p className="mt-1 text-[13px] leading-6 text-ink-soft">장보기부터 먹거리 탐방까지, 가까운 전통시장을 지역·주차·상품권 조건으로 찾아보세요.</p><Link href="/traditional-market" className="mt-3 inline-block text-[13px] font-bold text-[#9c5b24]">전국 전통시장 찾아보기 →</Link></section>;
}
