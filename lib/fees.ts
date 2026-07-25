// 미리 수집한 입장료 상태 (카드 배지용) — data/place-fees.json (GitHub Action이 점진 백필)
import feesData from "@/data/place-fees.json";

export type Admission = "free" | "paid" | "unknown";

const data = feesData as unknown as {
  generatedAt: string | null;
  fees: Record<string, Admission>;
};

/** 캐시된 입장료 상태 (없으면 undefined — 아직 미수집) */
export function getAdmission(id: string): Admission | undefined {
  return data.fees[id];
}

export function getFeeStats() {
  const v = Object.values(data.fees);
  return {
    total: v.length,
    free: v.filter((x) => x === "free").length,
    paid: v.filter((x) => x === "paid").length,
    unknown: v.filter((x) => x === "unknown").length,
  };
}
