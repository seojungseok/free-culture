// components/KidCoupangDeals.tsx
// "아이와 함께" 페이지용 쿠팡 4줄 가로 드래그 카드 (scripts/collectKidCoupang.mjs → data/kidCoupang.json).
//   ① 장난감  ② 피크닉 준비물  ③ 오늘의 특가  ④ 나들이 생활용품
// 서버 컴포넌트. 공정위 고지는 페이지 상단 <AffiliateNotice partner="coupang" /> 담당.

import deals from "@/data/kidCoupang.json";
import ScrollRail from "@/components/ScrollRail";
import AffiliateNotice from "@/components/AffiliateNotice";

interface Product { id: string; name: string; price: number; image: string; url: string; isRocket: boolean }
interface Section { key: string; heading: string; subtitle: string; products: Product[] }
interface Deals { generatedAt: string; sections: Section[] }

const won = (n: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");

function Card({ p, highlight }: { p: Product; highlight?: boolean }) {
  return (
    <a href={p.url} target="_blank" rel="sponsored nofollow noopener noreferrer"
      className="group flex w-[150px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-free/40 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] sm:w-[168px]">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} loading="lazy" referrerPolicy="unsafe-url" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        {highlight && <span className="absolute left-2 top-2 rounded-full bg-[#ff5b34] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">⚡ 특가</span>}
        {p.isRocket && <span className="absolute right-2 top-2 rounded-full bg-[#2c62f6] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">로켓배송</span>}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-[12.5px] font-semibold leading-[1.4] text-ink">{p.name}</p>
        <div className="mt-auto pt-2">
          <p className="text-[15px] font-black text-ink">{won(p.price)}<span className="ml-0.5 text-[12px] font-bold text-ink-soft">원</span></p>
          <p className="mt-0.5 text-[11.5px] font-bold text-free opacity-0 transition group-hover:opacity-100">특가 확인하기 →</p>
        </div>
      </div>
    </a>
  );
}

export default function KidCoupangDeals() {
  const d = deals as unknown as Deals;
  const products = (d?.sections || [])
    .filter((s) => s.key === "picnic" || s.key === "toys")
    .flatMap((s) => s.products || [])
    .filter((p) => p.url && p.image)
    .slice(0, 4);
  if (!products.length) return null;
  return (
    <>
      <AffiliateNotice className="mt-2" partner="coupang" />
      <div className="mt-3"><ScrollRail ariaLabel="아이와 나들이 준비물">{products.map((p) => <Card key={p.id} p={p} />)}</ScrollRail></div>
    </>
  );
}
