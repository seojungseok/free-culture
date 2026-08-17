// lib/campingStory.ts
// 캠핑장 구조화 데이터(지역·유형·시설·반려동물·운영기간 + 고캠핑 intro)를
// "읽기 편한 문단"으로 조합한다. AI 없이(비용 0), 전 캠핑장 즉시 적용.
//
// 원칙: 따닥따닥 붙이지 않는다. 짧은 문단 여러 개로 나눠 여백을 준다.
// 페이지에서 각 문단을 <p>로 렌더 → 네이버블로그 같은 세로 리듬.

import type { Camp } from "@/lib/camping";

// --- 한글 조사 처리 (받침 유무) -----------------------------------------
function hasBatchim(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절이 아니면 받침 없다고 간주
  return (code - 0xac00) % 28 !== 0;
}
// 단어 뒤에 붙일 "조사만" 반환한다 (단어는 이미 문장에 있으므로 중복 금지).
function particle(word: string, withB: string, withoutB: string): string {
  return hasBatchim(word) ? withB : withoutB;
}
const iGa = (w: string) => particle(w, "이", "가");
const gwaWa = (w: string) => particle(w, "과", "와");

// --- 안정적 의사난수 (id 기반) — 페이지마다 다르되 항상 같은 문장 선택 ----
function seeded(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

// 유형별 한 줄 설명(친근하게)
const TYPE_DESC: Record<string, string> = {
  글램핑: "글램핑 사이트가 있어서 무거운 장비 없이도 편하게 하룻밤 보내기 좋아요",
  카라반: "카라반이 마련돼 있어 초보 캠퍼나 아이와 함께여도 부담이 적어요",
  오토캠핑: "차를 사이트 옆에 댈 수 있는 오토캠핑이라 짐 옮기기가 한결 수월해요",
  일반야영장: "텐트를 직접 치는 일반야영장이라 캠핑 본연의 맛을 즐기기 좋아요",
};

export interface StoryInput {
  camp: Camp;
  region: string;          // "경기 양평군"
  facilities: string[];    // 참인 시설명
  nearFood?: string[];     // 주변 맛집 이름 (0~2개)
  nearPlaces?: string[];   // 주변 관광지 이름 (0~2개)
}

/** 캠핑장 소개 문단 배열. 각 원소 = 한 문단(짧게). */
export function campingStory({ camp, region, facilities, nearFood = [], nearPlaces = [] }: StoryInput): string[] {
  const rng = seeded(camp.id);
  const paras: string[] = [];
  const name = camp.name;
  const type = camp.types[0] || "캠핑장";

  // 1) 오프닝 — 위치 + 유형 + (있으면) 현지 소개
  //    이름 뒤에 조사를 붙이지 않는 형태만 골라 어색함을 피한다.
  const openings = [
    `${region}에 자리한 ${type}, ${name}. `,
    `${region} 캠핑을 알아보고 있다면 ${name}도 후보에 넣어볼 만해요. `,
  ];
  let open = pick(rng, openings);
  if (camp.intro && camp.intro.trim()) {
    open += `현지 소개로는 “${camp.intro.trim()}”라고 소개돼 있어요.`;
  } else {
    open += pick(rng, [
      "조용히 쉬어가기 좋은 곳을 찾는 분들이 한 번쯤 눈여겨볼 만한 캠핑장이에요.",
      "가족이나 친구와 가볍게 떠나기 좋은 캠핑장이에요.",
    ]);
  }
  paras.push(open);

  // 2) 유형 느낌
  const typeLines = camp.types.map((t) => TYPE_DESC[t]).filter(Boolean);
  if (typeLines.length) {
    paras.push(typeLines.slice(0, 2).join(". ") + ".");
  }

  // 3) 시설
  if (facilities.length >= 2) {
    const shown = facilities.slice(0, 5);
    const last = shown[shown.length - 1];
    paras.push(
      `${shown.join("·")}${gwaWa(last)} 같은 편의시설을 갖추고 있어서, ` +
        pick(rng, [
          "캠핑이 익숙지 않은 분도 크게 불편함 없이 지낼 수 있어요.",
          "필요한 건 대체로 현장에서 해결할 수 있는 편이에요.",
        ])
    );
  } else if (facilities.length === 1) {
    paras.push(`편의시설로는 ${facilities[0]}${iGa(facilities[0])} 확인돼요. 나머지는 예약 전 한 번 문의해 보시는 걸 추천해요.`);
  } else {
    paras.push("세부 편의시설 정보는 아직 정리되지 않았어요. 전기·샤워실 등이 필요하다면 예약 전에 미리 확인해 보세요.");
  }

  // 4) 반려동물
  if (camp.pet) {
    paras.push(
      pick(rng, [
        "반려동물과 함께 입장할 수 있어서, 댕댕이도 데려가고 싶은 분들에게 반가운 곳이에요.",
        "반려동물 동반이 가능해요. 다만 목줄·배변 등 기본 매너는 챙겨 주세요.",
      ])
    );
  } else if (camp.petRaw && camp.petRaw !== "정보 없음") {
    paras.push("반려동물 동반은 어려운 편이라, 함께 갈 계획이라면 이 점은 참고해 주세요.");
  }

  // 5) 운영 시즌
  if (camp.operPd && camp.operPd.trim()) {
    const all = ["봄", "여름", "가을", "겨울"].every((s) => camp.operPd.includes(s));
    paras.push(
      all
        ? "사계절 내내 운영해서 언제 찾아도 좋지만, 시즌마다 분위기가 달라지니 취향에 맞춰 방문 시기를 골라 보세요."
        : `${camp.operPd} 시즌에 운영해요. 방문 전 운영 여부를 한 번 더 확인하면 헛걸음을 줄일 수 있어요.`
    );
  }

  // 6) 주변 — 맛집·관광지
  const near: string[] = [];
  if (nearFood.length) near.push(`${nearFood.slice(0, 2).join(", ")} 같은 맛집`);
  if (nearPlaces.length) near.push(`${nearPlaces.slice(0, 2).join(", ")} 같은 볼거리`);
  if (near.length) {
    paras.push(
      `주변에는 ${near.join("도 있고, ")}도 가까워요. ` +
        "캠핑만 하고 돌아오기 아쉽다면 근처를 함께 둘러보는 코스로 짜 봐도 좋아요."
    );
  }

  // 7) 마무리 팁
  paras.push(
    "요금과 예약 방법, 운영 정보는 시즌에 따라 바뀔 수 있어요. 방문 전 아래 정보와 공식 채널을 꼭 다시 확인하시길 권해요."
  );

  return paras;
}
