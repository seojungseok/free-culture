// components/CampNoFireFood.tsx
// 캠핑 "글 중간"에 끼워 넣는 발열도시락 카드 — data/coupang.json 의 food 섹션을 쓴다.
// 원래 글 맨 아래 쿠팡 블록의 한 섹션이었는데, 아래에선 대부분 스크롤로 지나쳐서 본문 중간으로 올렸다.
// (그래서 CoupangDeals 는 이제 이 섹션을 렌더하지 않는다 — 같은 상품이 한 페이지에 두 번 나오지 않게)
//
// 클릭 장치는 CampEssentialPeek 과 같다.
//   ① "불 없이 밥이 뜨거워진다" = 모르던 사람에겐 그 자체가 궁금증("이런 게 있어?")
//   ② 가격은 가려 둔다 — "얼마지?"의 답을 보려면 눌러야 한다. 가짜 숫자는 쓰지 않는다.
// 문구는 두 줄로 끝낸다. 설명이 길면 광고로 읽혀서 오히려 안 눌린다.

import deals from "@/data/coupang.json";

interface Product { id: string; name: string; price: number; image: string; url: string; isRocket: boolean }
interface Section { key: string; products: Product[] }

/** 종류 판정 — 위에서부터 먼저 맞는 것. 순서가 중요하다(용기를 먼저 걸러야 도시락과 안 섞인다). */
const KINDS: { label: string; re: RegExp }[] = [
  { label: "발열용기", re: /발열가방|발열용기|가열용기|발열팩/ },
  { label: "발열도시락", re: /발열|핫앤쿡|비화식|바로쿡/ },
  { label: "전투식량", re: /전투식량|야전식량|즉각취식/ },
];
// 전기로 데우는 도시락은 "불 없이"라는 주제와 안 맞는다(수집 단계에서도 거르지만 여기서도 방어).
const EXCLUDE = /전기|충전|차량용|보온\s?도시락/;

function kindOf(name: string): string | null {
  if (EXCLUDE.test(name)) return null;
  return KINDS.find((k) => k.re.test(name))?.label ?? null;
}

function seeded(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shortName(n: string): string {
  const cut = n.split(/[,([]/)[0].trim();
  return (cut.length >= 6 ? cut : n).slice(0, 28);
}

export default function CampNoFireFood({ seed }: { seed: string }) {
  const sections = (deals as unknown as { sections?: Section[] }).sections || [];
  const products = sections.find((s) => s.key === "food")?.products || [];

  const byKind = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.url || !p.image) continue;
    const k = kindOf(p.name);
    if (!k) continue;
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k)!.push(p);
  }
  // 발열도시락(밥) → 전투식량 → 발열용기 순. 종류가 겹치지 않게 하나씩.
  const rng = seeded(seed);
  const items: { p: Product; label: string }[] = [];
  for (const k of ["발열도시락", "전투식량", "발열용기"]) {
    const list = byKind.get(k);
    if (list?.length) items.push({ p: list[Math.floor(rng() * list.length) % list.length], label: k });
  }
  if (items.length < 2) return null;

  return (
    <aside className="peek my-7 overflow-hidden rounded-2xl border border-[#ffd9cc] bg-gradient-to-b from-[#fff7f4] to-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#ffe4d9] bg-white/70 px-4 py-2.5">
        <p className="text-[13px] font-extrabold text-[#e8481c]">🍚 불 없이 먹는 캠핑 밥</p>
        <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9.5px] font-bold text-ink-faint">광고</span>
      </div>

      <p className="px-4 pt-2.5 text-[13px] font-bold leading-[1.6] text-ink">
        찬물만 부으면 15분 뒤 뜨거워집니다.
      </p>

      <ul className="mt-1 divide-y divide-[#ffe4d9]/70 px-1.5">
        {items.map(({ p, label }) => (
          <li key={p.id}>
            <a
              href={p.url}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-white"
            >
              <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  referrerPolicy="unsafe-url"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.06]"
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="rounded-md bg-[#ffefe9] px-1.5 py-[1px] text-[10.5px] font-extrabold text-[#e8481c]">{label}</span>
                  {p.isRocket && <span className="text-[10.5px] font-extrabold text-[#2c62f6]">로켓배송</span>}
                </span>
                <span className="mt-0.5 block truncate text-[13.5px] font-bold text-ink">{shortName(p.name)}</span>
              </span>

              {/* 가격은 가린다 — 숫자는 지어내지 않고 물음표 마스크만(CampEssentialPeek 과 동일 장치). */}
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="peek-price" aria-hidden="true">?,???원</span>
                <span className="sr-only">가격은 쿠팡에서 확인</span>
                <span className="text-[11px] font-extrabold text-[#e8481c]">
                  얼마? <span className="peek-arrow inline-block">→</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="px-4 pb-4 pt-1.5">
        <a
          href={items[0].p.url}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="peek-cta relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 py-3 text-[14px] font-black text-white"
        >
          <span className="relative z-10">가격 확인</span>
          <span className="peek-arrow relative z-10">→</span>
        </a>
      </div>
    </aside>
  );
}
