// 미리 수집한 입장료 상태 (카드 배지용) — data/place-fees.json + place-intro.json
// intro 백필이 detailIntro2 전체(요금 포함)를 수집하므로 fees의 상위집합. fees→intro 순 폴백.
import feesData from "@/data/place-fees.json";
import introData from "@/data/place-intro.json";

export type Admission = "free" | "paid" | "unknown";

const data = feesData as unknown as {
  generatedAt: string | null;
  fees: Record<string, Admission>;
};
const intro = (introData as unknown as { intro: Record<string, { admission?: Admission }> }).intro || {};

/** 캐시된 입장료 상태 (fees → intro 폴백, 둘 다 없으면 undefined) */
export function getAdmission(id: string): Admission | undefined {
  return data.fees[id] ?? intro[id]?.admission;
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
