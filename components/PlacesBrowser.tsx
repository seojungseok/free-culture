"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TourSpot } from "@/lib/tour";
import { SIDO_SLUG } from "@/lib/classify";
import TourCard from "./TourCard";
import { Container } from "./Band";

const PAGE = 24;

type TypeKey = "all" | "12" | "14" | "28";
const TYPE_TABS: { key: TypeKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "12", label: "관광지" },
  { key: "14", label: "문화시설" },
  { key: "28", label: "체험·레포츠" },
];

export default function PlacesBrowser({
  spots,
  areas,
  initialArea = "",
  kidOnly = false,
  total,
  typeTotals,
}: {
  spots: TourSpot[];
  areas: { area: string; count: number }[];
  initialArea?: string;
  kidOnly?: boolean;
  /** 전국 그랜드 토탈 (전국 뷰는 그리드에 샘플만 실려서 별도 전달) */
  total?: number;
  /** 유형 필터 숫자용 — 전체 데이터 기준 집계(현재 area 문맥). 카드는 샘플이어도 숫자는 전체 반영 */
  typeTotals?: Record<TypeKey, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlType = params.get("type");
  const initType: TypeKey = urlType === "12" || urlType === "14" || urlType === "28" ? urlType : "all";
  const whoKid = params.get("who") === "kid";
  const [area, setArea] = useState(initialArea);
  const [type, setType] = useState<TypeKey>(initType);
  const [visible, setVisible] = useState(PAGE);

  const areaSpots = useMemo(() => {
    let list = area ? spots.filter((s) => s.area === area) : spots;
    if (whoKid) list = list.filter((s) => s.isKid);
    return list;
  }, [spots, area, whoKid]);

  // 유형별 개수 — 전체 집계(typeTotals)가 오면 그걸 우선(4-5: 필터 숫자=전체 반영).
  // 없을 때만 로컬 스팟에서 집계(하위호환).
  const typeCounts = useMemo(() => {
    if (typeTotals) return typeTotals;
    const c: Record<TypeKey, number> = { all: areaSpots.length, "12": 0, "14": 0, "28": 0 };
    for (const s of areaSpots) if (s.type in c) c[s.type as TypeKey]++;
    return c;
  }, [areaSpots, typeTotals]);

  const filtered = useMemo(
    () => (type === "all" ? areaSpots : areaSpots.filter((s) => s.type === type)),
    [areaSpots, type]
  );
  const shown = filtered.slice(0, visible);
  const grandTotal = total ?? spots.length;
  const isNationSample = !area && total != null && total > spots.length;
  // 제목 옆 개수 — 전체 집계가 있으면 현재 유형의 전체 수, 없으면 기존 로직
  const displayCount = typeTotals ? typeTotals[type] : isNationSample ? grandTotal : filtered.length;

  function pick(a: string) {
    setArea(a);
    setType("all");
    setVisible(PAGE);
    const slug = a ? (SIDO_SLUG as Record<string, string>)[a] : "";
    const target = slug ? `/places/${slug}` : "/places";
    if (pathname !== target) router.push(target);
  }
  function pickType(t: TypeKey) {
    setType(t);
    setVisible(PAGE);
  }

  return (
    <div className="bg-panel">
      {/* 지역 탭 */}
      <div className="sticky top-[57px] z-30 border-b border-line bg-white/95 backdrop-blur">
        <Container className="py-2.5">
          <div className="flex gap-1.5 gap-y-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
            <AreaChip active={!area} label="전체" count={grandTotal} onClick={() => pick("")} />
            {areas.map((a) => (
              <AreaChip
                key={a.area}
                active={area === a.area}
                label={a.area}
                count={a.count}
                onClick={() => pick(a.area)}
              />
            ))}
          </div>
        </Container>
      </div>

      <Container className="pb-12 pt-4">
        {/* 유형 필터 */}
        {!kidOnly && (
          <div className="mb-4 flex gap-1.5 gap-y-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
            {TYPE_TABS.map((t) => {
              const n = typeCounts[t.key];
              const disabled = t.key !== "all" && n === 0;
              const active = type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => !disabled && pickType(t.key)}
                  disabled={disabled}
                  className={[
                    "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition",
                    active
                      ? "bg-ink text-white shadow-sm"
                      : disabled
                      ? "border border-line bg-white text-ink-dim/45"
                      : "border border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink",
                  ].join(" ")}
                >
                  {t.label}
                  <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-1 flex items-baseline gap-2">
          <h2 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[22px]">
            {area || "전국"} 나들이
          </h2>
          <span className="text-[14px] font-bold text-free">
            {displayCount.toLocaleString()}곳
          </span>
        </div>
        {isNationSample && (
          <p className="mb-4 text-[12.5px] text-ink-faint">
            추천 {spots.length.toLocaleString()}곳 미리보기 · <b className="font-bold text-ink-soft">지역을 선택하면 전부 볼 수 있어요</b>
          </p>
        )}

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-ink-soft">
            해당 조건의 장소가 없어요.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {shown.map((s) => (
              <TourCard key={s.id} spot={s} />
            ))}
          </div>
        )}

        {visible < filtered.length && (
          <div className="mt-9 flex justify-center">
            <button
              onClick={() => setVisible((v) => v + PAGE)}
              className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
            >
              더 보기 ({(filtered.length - visible).toLocaleString()}곳 남음)
            </button>
          </div>
        )}

        <p className="mt-8 text-[12px] text-ink-faint">관광정보 제공: 한국관광공사 (TourAPI)</p>
      </Container>
    </div>
  );
}

function AreaChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition",
        active
          ? "bg-free text-white shadow-sm"
          : "border border-line bg-white text-ink-soft hover:border-free/40 hover:text-free",
      ].join(" ")}
    >
      {label}
      <span className={["text-[11px] tabular-nums", active ? "text-white/80" : "text-ink-dim"].join(" ")}>
        {count}
      </span>
    </button>
  );
}
