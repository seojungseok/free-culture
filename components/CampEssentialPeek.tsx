// components/CampEssentialPeek.tsx
// 캠핑 "글 중간"에 끼워 넣는 생필품 미끼 카드 — data/coupangEssentials.json (scripts/collectCoupangEssentials.mjs)
//
// 왜 글 중간인가
//   쿠팡 링크가 글 맨 아래에만 있으면 대부분 스크롤로 지나쳐 버린다(배너 블라인드니스).
//   본문을 읽다가 시선이 걸리는 자리에, 본문처럼 생긴 작은 블록으로 넣는다.
//
// 왜 "가격을 안 보여주나" — 이게 이 카드의 핵심 장치다.
//   ① 가격을 가려두면 "이거 진짜 싼가? 얼마지?" 하는 궁금증(정보 격차)이 생기고, 그 답을 보려면 눌러야 한다.
//   ② 물·화장지·물티슈처럼 **다들 대충 얼마인지 아는 물건**이라 비교 욕구가 바로 걸린다.
//   ③ 실무적으로도 안전 — 쿠팡 가격은 수시로 바뀌어서 캐시된 페이지에 옛 가격이 남는 사고가 없다.
//   그래서 수집 단계(collectCoupangEssentials.mjs)부터 아예 가격을 저장하지 않는다.
//
// 노출 개수는 2~3개만. 많이 깔면 광고 티가 나서 오히려 안 눌린다.
// 캠핑장 id로 고르므로 페이지마다 다른 상품이 나오고, 같은 페이지는 항상 같은 상품(캐시 안전).

import essentials from "@/data/coupangEssentials.json";

interface Item {
  id: string; name: string; image: string; url: string;
  isRocket?: boolean; kind: string; label: string; deal?: boolean;
}

/** 캠핑장 id → 항상 같은 값(페이지별로는 다름). 재생성해도 결과가 안 바뀌게 결정적으로. */
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

// 상품명이 너무 길면 앞부분만 — "무엇인지"만 알면 되고, 길면 광고처럼 보인다.
function shortName(n: string): string {
  const cut = n.split(/[,(]/)[0].trim();
  return (cut.length >= 6 ? cut : n).slice(0, 28);
}

/** 종류를 섞어 n개 고른다 — 물·화장지·물티슈처럼 서로 다른 게 나와야 "생필품 코너"로 읽힌다. */
function pickItems(pool: Item[], seed: string, n: number): Item[] {
  const rng = seeded(seed);
  const byKind = new Map<string, Item[]>();
  for (const p of pool) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, []);
    byKind.get(p.kind)!.push(p);
  }
  // 물 → 화장지 → 물티슈 순서를 우선(사용자가 가장 자주 사는 것), 나머지는 뒤에
  const order = ["물", "화장지", "물티슈", "주방", "정리"];
  const kinds = [...byKind.keys()].sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const out: Item[] = [];
  for (const k of kinds) {
    if (out.length >= n) break;
    const list = byKind.get(k)!;
    // 특가로 잡힌 게 있으면 그걸 우선(진짜 할인 상품), 없으면 페이지별로 돌아가며 하나
    const deals = list.filter((p) => p.deal);
    const from = deals.length ? deals : list;
    out.push(from[Math.floor(rng() * from.length) % from.length]);
  }
  return out.slice(0, n);
}

export default function CampEssentialPeek({ seed, campName }: { seed: string; campName?: string }) {
  const pool = ((essentials as { pool?: Item[] }).pool || []).filter((p) => p.url && p.image);
  if (pool.length < 2) return null;
  const items = pickItems(pool, seed, 3);
  if (items.length < 2) return null;

  const labels = [...new Set(items.map((i) => i.label))].join("·");

  return (
    <aside className="peek my-7 overflow-hidden rounded-2xl border border-[#ffd9cc] bg-gradient-to-b from-[#fff7f4] to-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#ffe4d9] bg-white/70 px-4 py-2">
        <p className="text-[12.5px] font-extrabold text-[#e8481c]">
          ⛺ 짐 싸기 전에 — {labels}, 지금 얼마일까요?
        </p>
        <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9.5px] font-bold text-ink-faint">광고</span>
      </div>

      <p className="px-4 pt-3 text-[13px] leading-[1.6] text-ink-soft">
        {campName ? `${campName} 가기 전에 ` : "캠핑 가기 전에 "}
        한 번씩 담게 되는 것들이에요. <b className="text-ink">가격은 일부러 적지 않았어요</b> — 수시로 바뀌거든요.
        눌러서 <b className="text-ink">지금 가격만</b> 확인해 보세요.
      </p>

      <ul className="mt-2.5 divide-y divide-[#ffe4d9]/70 px-1.5">
        {items.map((p) => (
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
                  <span className="rounded-md bg-[#ffefe9] px-1.5 py-[1px] text-[10.5px] font-extrabold text-[#e8481c]">{p.label}</span>
                  {p.isRocket && <span className="text-[10.5px] font-extrabold text-[#2c62f6]">로켓배송</span>}
                </span>
                <span className="mt-0.5 block truncate text-[13.5px] font-bold text-ink">{shortName(p.name)}</span>
              </span>

              {/* 가려진 가격 — 이 카드의 심장. 흐릿하게 반짝여서 "뭐라고 적혀 있지?" 하고 누르게 만든다.
                  ★ 숫자는 절대 지어내지 않는다(가짜 가격 금지). 물음표 마스크로 "가려져 있음"만 보여준다. */}
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
          href={items[0].url}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="peek-cta relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 py-3 text-[14px] font-black text-white"
        >
          <span className="relative z-10">가격만 살짝 보고 오기</span>
          <span className="peek-arrow relative z-10">→</span>
        </a>
        <p className="mt-2 text-center text-[11px] leading-[1.5] text-ink-faint">
          클릭하면 쿠팡에서 지금 가격이 바로 보여요. 안 사도 괜찮아요.
        </p>
      </div>
    </aside>
  );
}
