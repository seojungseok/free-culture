// components/CoupangDeals.tsx
// 캠핑 페이지용 쿠팡 상품 — 가로 드래그 카드 (scripts/collectCoupang.mjs → data/coupang.json).
//   ① 캠핑 필수템  ② 계절별 용품  ③ 오늘의 쿠팡 특가(골드박스)
//   ※ "불 없이 먹는 캠핑 음식"(food)은 여기서 렌더하지 않는다 — 본문 중간 CampNoFireFood 로 옮겼다.
//     아래에 있으면 대부분 스크롤로 지나쳐서. 한 페이지에 같은 상품이 두 번 나오지 않게 여기선 제외.
// 서버 컴포넌트: 방문자마다 API를 호출하지 않고, 미리 수집한 JSON을 렌더한다.
// 공정위 고지는 페이지 상단 <AffiliateNotice partner="coupang" /> 가 담당(중복 방지).

import deals from "@/data/coupang.json";
import ScrollRail from "@/components/ScrollRail";
import AffiliateNotice from "@/components/AffiliateNotice";

interface Product { id: string; name: string; price: number; image: string; url: string; isRocket: boolean }
interface Section { key: string; heading: string; subtitle: string; products: Product[] }
interface Deals { generatedAt: string; season: string; seasonLabel: string; sections: Section[] }

const won = (n: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");

function Card({ p, highlight }: { p: Product; highlight?: boolean }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      className="group flex w-[150px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-free/40 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] sm:w-[168px]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          referrerPolicy="unsafe-url"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
        {highlight && (
          <span className="absolute left-2 top-2 rounded-full bg-[#ff5b34] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">
            ⚡ 특가
          </span>
        )}
        {p.isRocket && (
          <span className="absolute right-2 top-2 rounded-full bg-[#2c62f6] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">
            로켓배송
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-[12.5px] font-semibold leading-[1.4] text-ink">{p.name}</p>
        <div className="mt-auto pt-2">
          <p className="text-[15px] font-black text-ink">
            {won(p.price)}
            <span className="ml-0.5 text-[12px] font-bold text-ink-soft">원</span>
          </p>
          <p className="mt-0.5 text-[11.5px] font-bold text-free opacity-0 transition group-hover:opacity-100">
            특가 확인하기 →
          </p>
        </div>
      </div>
    </a>
  );
}

export default function CoupangDeals() {
  const d = deals as unknown as Deals;
  const products = (d?.sections || [])
    .filter((s) => s.key === "staples" || s.key === "seasonal")
    .flatMap((s) => s.products || [])
    .filter((p) => p.url && p.image)
    .slice(0, 4);
  if (!products.length) return null;

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="text-[17px] font-extrabold text-ink">캠핑에 필요한 준비물</h2>
      <p className="mt-0.5 text-[13px] text-ink-faint">캠핑과 직접 관련된 상품만 골라봤어요.</p>
      <AffiliateNotice className="mt-2" partner="coupang" />
      <div className="mt-3">
        <ScrollRail ariaLabel="캠핑에 필요한 준비물">
          {products.map((p) => <Card key={p.id} p={p} />)}
        </ScrollRail>
      </div>
    </section>
  );
}
