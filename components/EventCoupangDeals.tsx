// components/EventCoupangDeals.tsx
// 문화행사 상세페이지용 쿠팡 상품 — 4줄 가로 드래그 카드 (scripts/collectEventCoupang.mjs → data/eventCoupang.json).
//   ① 관람 챙길 아이템  ② 장르 맞춤(realmName으로 자동 선택)  ③ 나들이 소품  ④ 골드박스
// 서버 컴포넌트: 방문자마다 API 호출 X. 공정위 고지는 페이지 상단 <AffiliateNotice partner="coupang" /> 담당.

import deals from "@/data/eventCoupang.json";
import ScrollRail from "@/components/ScrollRail";
import AffiliateNotice from "@/components/AffiliateNotice";

interface Product { id: string; name: string; price: number; image: string; url: string; isRocket: boolean }
interface Sec { heading: string; subtitle: string; products: Product[] }
interface EventDeals { generatedAt: string; essentials: Sec; outing: Sec; goldbox: Sec; genres: Record<string, Sec> }

const won = (n: number) => (typeof n === "number" ? n.toLocaleString("ko-KR") : "");

// realmName(예: "음악/콘서트") → 장르 풀 키
function genreKey(realm: string): string | null {
  const r = realm || "";
  if (/음악|콘서트|클래식|국악/.test(r)) return "음악";
  if (/연극|뮤지컬|오페라|무용|발레/.test(r)) return "공연";
  if (/전시/.test(r)) return "전시";
  if (/아동|가족|교육|체험/.test(r)) return "가족";
  return null;
}

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

function Row({ sec, highlight }: { sec?: Sec; highlight?: boolean }) {
  if (!sec?.products?.length) return null;
  return (
    <section>
      <div className="mb-0.5">
        <h2 className="text-[17px] font-extrabold text-ink">{sec.heading}</h2>
        <p className="mt-0.5 text-[13px] text-ink-faint">{sec.subtitle}</p>
      </div>
      <div className="mt-3">
        <ScrollRail ariaLabel={sec.heading}>
          {sec.products.map((p) => <Card key={p.id} p={p} highlight={highlight} />)}
        </ScrollRail>
      </div>
    </section>
  );
}

export default function EventCoupangDeals({ realmName }: { realmName: string }) {
  const d = deals as unknown as EventDeals;
  if (!d?.essentials) return null;
  const gk = genreKey(realmName);
  const genre = gk ? d.genres?.[gk] : undefined;
  const products = [...(d.essentials.products || []), ...(genre?.products || [])]
    .filter((p, i, all) => p.url && p.image && all.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);
  if (!products.length) return null;

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="text-[17px] font-extrabold text-ink">관람에 필요한 준비물</h2>
      <p className="mt-0.5 text-[13px] text-ink-faint">공연·전시 관람과 직접 관련된 상품만 골라봤어요.</p>
      <AffiliateNotice className="mt-2" partner="coupang" />
      <div className="mt-3"><ScrollRail ariaLabel="관람에 필요한 준비물">{products.map((p) => <Card key={p.id} p={p} />)}</ScrollRail></div>
    </section>
  );
}
