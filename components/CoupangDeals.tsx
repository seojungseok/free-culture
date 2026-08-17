// components/CoupangDeals.tsx
// 계절별 캠핑용품 추천 카드 (쿠팡 오픈 API로 수집 → data/coupang.json).
// 서버 컴포넌트: 방문자마다 API를 호출하지 않고, 미리 수집한 JSON을 렌더한다.
//
// 공정위 고지는 페이지 상단 <AffiliateNotice partner="coupang" /> 가 담당(중복 방지).
// 쿠팡 이미지 도메인은 next/image 미등록이라 <img>로 직접 렌더(lazy).

import deals from "@/data/coupang.json";

interface Product {
  id: string; name: string; price: number;
  image: string; url: string; isRocket: boolean; keyword: string;
}
interface Deals {
  season: string; label: string; heading: string; subtitle: string;
  generatedAt: string; products: Product[];
}

const won = (n: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");

export default function CoupangDeals({ max = 8 }: { max?: number }) {
  const d = deals as unknown as Deals;
  const products = (d?.products || []).slice(0, max);
  if (!products.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-3">
        <h2 className="text-[17px] font-extrabold text-ink">{d.heading}</h2>
        <p className="mt-0.5 text-[13px] text-ink-faint">{d.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((p, i) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-free/40 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]"
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
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-free px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">
                  🔥 인기
                </span>
              )}
              {p.isRocket && (
                <span className="absolute right-2 top-2 rounded-full bg-[#2c62f6] px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-sm">
                  로켓배송
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-2.5">
              <p className="line-clamp-2 text-[12.5px] font-semibold leading-[1.4] text-ink">
                {p.name}
              </p>
              <div className="mt-auto pt-2">
                <p className="text-[15px] font-black text-ink">
                  {won(p.price)}
                  <span className="ml-0.5 text-[12px] font-bold text-ink-soft">원</span>
                </p>
                <p className="mt-0.5 text-[11.5px] font-bold text-free opacity-0 transition group-hover:opacity-100">
                  쿠팡에서 보기 →
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
