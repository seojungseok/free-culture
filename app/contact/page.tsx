import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "문의",
  description: `${SITE.name}에 광고 문의, 행사 정보 오류 제보, 행사 등록 요청, 기타 문의를 남겨주세요.`,
  alternates: { canonical: "/contact" },
};

const MAIL = SITE.email;

export default function ContactPage() {
  return (
    <div className="prose-page">
      <h1>문의</h1>
      <p>
        아래 이메일로 문의해 주세요. 확인 후 최대한 빠르게 답변드리겠습니다.
        메일 제목에 문의 유형을 적어주시면 처리가 빨라집니다.
      </p>

      <p>
        <a href={`mailto:${MAIL}`} className="text-lg font-bold">
          {MAIL}
        </a>
      </p>

      <h2>📢 광고 문의</h2>
      <p>
        배너·제휴 광고를 원하시면{" "}
        <a href={`mailto:${MAIL}?subject=[광고문의]`}>{MAIL}</a> 로 매체 소개와
        함께 문의해 주세요.
      </p>

      <h2>🛠 행사 정보 오류 제보</h2>
      <p>
        일정·요금·장소가 실제와 다르거나 이미 종료된 행사가 남아 있다면 알려주세요.
        공공데이터 기반이라 원본이 늦게 갱신될 수 있는데,{" "}
        <b>제보해 주시면 저희가 더 정확해집니다.</b> 행사 이름과 함께{" "}
        <a href={`mailto:${MAIL}?subject=[정보오류제보]`}>{MAIL}</a> 로 보내주세요.
      </p>

      <h2>➕ 행사 등록 요청</h2>
      <p>
        공공데이터에 아직 없는 행사를 알리고 싶으시면 행사명·장소·기간·요금·포스터와
        함께 <a href={`mailto:${MAIL}?subject=[행사등록요청]`}>{MAIL}</a> 로
        보내주세요.
      </p>

      <h2>✉️ 기타 문의</h2>
      <p>
        그 밖의 문의나 삭제 요청(주최자 확인 가능한 정보 포함)은{" "}
        <a href={`mailto:${MAIL}?subject=[기타문의]`}>{MAIL}</a> 로 보내주시면
        신속히 처리하겠습니다.
      </p>

      <p className="text-sm text-ink-faint">출처: {SITE.source}</p>
    </div>
  );
}
