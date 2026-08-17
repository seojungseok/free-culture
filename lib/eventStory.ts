// lib/eventStory.ts
// 문화행사 구조화 데이터(제목·장르·지역·장소·기간·요금·관람층)를 읽기 편한 문단으로 조합.
// 공식 소개(contents)가 없는 행사(93%)의 빈 소개 영역을 채운다. AI 없음(비용 0).

import { fmtRange } from "@/lib/format";

export interface EventStoryInput {
  title: string;
  realmName: string;   // "음악/콘서트", "전시" ...
  area: string;
  sigungu: string;
  place: string;
  startDate: string;   // YYYYMMDD
  endDate: string;
  priceLabel: string;
  priceType: string;   // free | free_estimated | partial_free | paid | unknown
  audiences?: string[];
}

// 장르별 한 줄 감성 설명
const GENRE_FLAVOR: { re: RegExp; line: string }[] = [
  { re: /뮤지컬|오페라/, line: "노래와 연기, 무대가 한데 어우러져 눈과 귀가 동시에 즐거운 공연이에요." },
  { re: /음악|콘서트|클래식/, line: "라이브로 듣는 음악은 현장의 울림이 달라요. 좋아하는 순간이 나올 때의 몰입감을 기대해도 좋아요." },
  { re: /국악/, line: "우리 소리의 깊은 울림을 가까이서 만날 수 있는 국악 무대예요." },
  { re: /전시/, line: "전시는 서두르지 않고 천천히 둘러볼 때 더 눈에 들어와요. 마음에 드는 작품 앞에서 잠시 머물러 보세요." },
  { re: /연극/, line: "무대 위 배우들의 호흡을 가까이서 느낄 수 있는 연극이에요. 대사 하나하나에 집중하면 더 재미있어요." },
  { re: /무용|발레/, line: "몸짓만으로 이야기를 전하는 무용 공연이에요. 무대의 선과 흐름을 따라가 보세요." },
  { re: /교육|체험/, line: "직접 참여하며 즐기는 체험형 프로그램이에요. 함께 온 사람과 손을 맞대며 즐기기 좋아요." },
  { re: /축제|행사/, line: "가볍게 둘러보며 분위기를 즐기기 좋은 행사예요. 일정에 여유를 두고 방문해 보세요." },
  { re: /아동|가족/, line: "온 가족이 함께 즐기기 좋은 프로그램이에요." },
];

function audienceLine(aud: string[] = []): string | null {
  if (aud.includes("couple")) return "연인과 함께라면 데이트 코스로도 잘 어울려요.";
  if (aud.includes("family")) return "가족 나들이로 다녀오기 좋아요.";
  if (aud.includes("kids") || aud.includes("child")) return "아이와 함께 가기 좋은 행사예요.";
  if (aud.includes("solo")) return "혼자 조용히 즐기기에도 부담 없어요.";
  return null;
}

/** 문화행사 소개 문단 배열(짧게 나눠 여백 있게). */
export function eventStory(ev: EventStoryInput): string[] {
  const region = [ev.area, ev.sigungu].filter(Boolean).join(" ");
  const where = ev.place ? `${region} ${ev.place}` : region;
  const paras: string[] = [];

  // 1) 무엇을·어디서·언제
  let open = `${where}에서 만날 수 있는 ${ev.realmName || "문화행사"}, 《${ev.title}》.`;
  const range = fmtRange(ev.startDate, ev.endDate);
  if (range) open += ` ${range} 동안 열려요.`;
  paras.push(open);

  // 2) 장르 감성
  const flavor = GENRE_FLAVOR.find((g) => g.re.test(ev.realmName || ""));
  if (flavor) paras.push(flavor.line);

  // 3) 요금
  if (/free/.test(ev.priceType)) {
    paras.push(
      ev.priceType === "partial_free"
        ? "일부 대상은 무료로 관람할 수 있으니, 해당되는지 미리 확인해 보세요."
        : "무료로 즐길 수 있어 부담 없이 다녀오기 좋아요."
    );
  } else if (ev.priceType === "unknown") {
    paras.push("관람료 정보가 따로 없어, 방문 전 공식 페이지에서 확인하는 걸 추천해요.");
  } else if (ev.priceLabel) {
    paras.push(`관람료는 ${ev.priceLabel} 수준이에요.`);
  }

  // 4) 관람층
  const aud = audienceLine(ev.audiences);
  if (aud) paras.push(aud);

  // 5) 마무리
  paras.push("정확한 회차와 예매 방법, 변동 사항은 방문 전 공식 페이지에서 한 번 더 확인해 주세요.");

  return paras;
}
