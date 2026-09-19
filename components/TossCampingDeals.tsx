"use client";

import ScrollRail from "@/components/ScrollRail";

const products = [
  { name: "스파클 생수, 무라벨, 2L, 24개", image: "https://shopping.toss.im/live/temp/2026-03-18/268e4c6a-1595-43e9-9c1b-f101e5774429.jpeg", href: "https://toss.im/_m/leDNJ41b", tag: "캠핑 생수" },
  { name: "오즈랜드 우리곡물 크리스피롤 23곡, 660g", image: "https://shopping.toss.im/live/temp/2025-07-25/7ca9d4c9-fb69-4a3e-bd3d-58c5a6980da7.jpeg", href: "https://toss.im/_m/HfUqiHms", tag: "간식" },
  { name: "한우 사골 도가니탕, 500g, 5팩", image: "https://shopping.toss.im/live/taca/ai/Mzk0NDM5/YjREN3FJTVc0VFdTRnFVemU4N1dZdWNNV3YwZU5BUHRhTk5yZ0FWS0lRND0.png", href: "https://toss.im/_m/bewk0CU4", tag: "든든한 한 끼" },
  { name: "을지로 연탄불고기식 돼지불고기, 250g, 4개", image: "https://shopping.toss.im/live/temp/2026-08-27/6fb1bb32-205c-4951-a2d8-18f8c132d76f.jpeg", href: "https://toss.im/_m/NuhowbVy", tag: "캠핑 저녁" },
  { name: "펩시 제로슈거 라임, 245ml, 30개", image: "https://shopping.toss.im/live/taca/ai/YTI5M2Zm/QU9LVVlwd3p2NzlCdld1TVk5enZudUZXcTFFcnN4Q3JuS3ZVUUw2dlZKOWg.png", href: "https://toss.im/_m/1ByXXvGs", tag: "음료" },
  { name: "산과들에 원데이 발란스 그린라벨, 20g, 30봉", image: "https://shopping.toss.im/live/taca/ai/MmNlNjFi/QUszS3g4YldOeXgvK2x4K0ZsOFlzbm1CSEsxclpHUlhvVld4TXBXNkJQVk8.png", href: "https://toss.im/_m/nEa54fHu", tag: "휴대 간식" },
] as const;

export default function TossCampingDeals() {
  return <section className="mx-auto w-full max-w-[1120px] px-5 pt-9 sm:px-6 sm:pt-12 lg:px-8" aria-labelledby="toss-camping-deals-title">
    <div className="overflow-hidden rounded-[22px] border border-[#e9e1d2] bg-[linear-gradient(125deg,#fffaf0_0%,#fff_52%,#f2faf5_100%)] p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-black tracking-[0.08em] text-[#c85d2b]">WEEKEND PICK</p><h2 id="toss-camping-deals-title" className="mt-1 text-[20px] font-black tracking-[-0.04em] text-[#1c312b] sm:text-[25px]">가을 캠핑 특가 모음</h2><p className="mt-1 text-[12px] leading-5 text-[#61716a] sm:text-[13px]">먹거리·음료, 출발 전 한 번에 골라보세요.</p></div>
        <span className="shrink-0 rounded-full bg-[#e95835] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">특가 확인</span>
      </div>
      <div className="mt-4"><ScrollRail ariaLabel="가을 캠핑 특가 상품">{products.map((product, index) => <a key={product.href} href={product.href} target="_blank" rel="sponsored noopener noreferrer" className="group w-[calc((100vw-56px)/3)] shrink-0 snap-start overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.07] transition hover:-translate-y-0.5 hover:shadow-lg sm:w-[190px]">
        <div className="relative aspect-square overflow-hidden bg-[#f5f4f0]"><img src={product.image} alt={product.name} loading={index < 3 ? "eager" : "lazy"} referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"/><span className="absolute left-1.5 top-1.5 rounded-md bg-[#e95835] px-1.5 py-0.5 text-[9px] font-extrabold text-white">특가</span></div>
        <div className="p-2.5 sm:p-3"><p className="text-[10px] font-bold text-[#c85d2b]">{product.tag}</p><h3 className="mt-1 line-clamp-2 min-h-[32px] text-[11px] font-extrabold leading-[1.4] text-[#253932] sm:min-h-[39px] sm:text-[13px]">{product.name}</h3><p className="mt-2 text-[10px] font-black text-[#16704d] sm:text-[12px]">토스에서 가격 확인 →</p></div>
      </a>)}</ScrollRail></div>
      <p className="mt-3 text-[10px] leading-4 text-[#7a807c]">← 옆으로 밀어 더 보기 · 인기 구성은 재고·가격이 바뀔 수 있으니 출발 전에 확인하세요.</p>
      <p className="mt-2 text-[10px] leading-4 text-[#8b8d89]">✱ 이 포스팅은 토스쇼핑 쉐어링크 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
    </div>
  </section>;
}
