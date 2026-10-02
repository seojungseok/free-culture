import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "문의와 정보 수정 제보",
  description: `${SITE.name}의 행사·장소·코스·캠핑장 정보 오류, 등록 요청, 권리 관련 문의를 접수하는 방법입니다.`,
  alternates: { canonical: "/contact" },
};

const MAIL = SITE.email;
const mailLink = (subject: string, body: string) => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export default function ContactPage() {
  return (
    <div className="prose-page">
      <h1>문의와 정보 수정 제보</h1>
      <p>행사 일정이 바뀌었거나 장소의 운영·예약·이용 조건이 다르다면 알려주세요. 아래 이메일로 문의 내용을 보내주시면 제공된 근거와 원문 안내를 확인할 수 있습니다.</p>
      <p><a href={`mailto:${MAIL}`} className="text-lg font-bold">{MAIL}</a></p>
      <p>아래 버튼은 메일 앱을 엽니다. 메일 앱이 설정되어 있지 않으면 이메일 주소를 복사해 평소 사용하는 메일 서비스에서 보내주세요.</p>

      <h2>행사·장소 정보 오류 제보</h2>
      <p>행사뿐 아니라 나들이 장소, 음식점, 캠핑장, 시티투어, 여행코스의 잘못된 정보도 접수합니다. 원본 공공자료의 갱신이 늦거나 운영처의 안내가 달라진 경우를 구분할 수 있도록 다음 내용을 보내주세요.</p>
      <ul>
        <li>이 사이트의 해당 페이지 주소와 행사·장소 이름</li>
        <li>잘못된 항목과 바뀐 내용: 일정, 휴무, 요금, 주소, 예약, 시설 이용 조건 등</li>
        <li>수정 근거가 되는 운영처의 공식 공지 주소와 확인한 날짜</li>
      </ul>
      <p><a href={mailLink("[정보 오류 제보]", "해당 페이지 주소:\n행사·장소 이름:\n잘못된 항목:\n수정 내용:\n공식 안내 주소:\n확인 날짜:\n")} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 font-bold text-brandblue">정보 오류 제보 메일 작성</a></p>

      <h2>행사 등록 요청</h2>
      <p>공공자료에 아직 없는 행사를 알리고 싶다면 행사명·장소·기간·요금과 주최기관의 공식 안내 주소를 보내주세요. 포스터를 보낼 때는 게시 권한이 있는 자료를 사용해 주세요. 정보 확인이 필요한 요청은 바로 공개되지 않을 수 있습니다.</p>
      <p><a href={mailLink("[행사 등록 요청]", "행사명:\n주최기관:\n장소:\n기간:\n요금·이용 조건:\n공식 안내 주소:\n자료 게시 권한:\n")} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 font-bold text-brandblue">행사 등록 요청 메일 작성</a></p>

      <h2>사진·저작권·삭제 요청과 기타 문의</h2>
      <p>문제가 있는 페이지 주소, 해당 이미지나 문구, 요청 내용을 보내주세요. 권리 관련 요청에는 권리자 또는 대리인임을 확인할 수 있는 공식 안내나 자료를 함께 보내주시면 확인에 도움이 됩니다. 주민등록번호·결제정보·계정 비밀번호 등은 보내지 마세요.</p>
      <p><a href={mailLink("[권리·기타 문의]", "해당 페이지 주소:\n문제가 있는 자료:\n요청 내용:\n확인 가능한 근거:\n")} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 font-bold text-brandblue">권리·기타 문의 메일 작성</a></p>
      <p>자료의 출처와 편집 방식은 <Link href="/about">소개와 정보 편집 기준</Link>에서, 이메일 문의 및 브라우저 저장에 관한 안내는 <Link href="/privacy">개인정보처리방침</Link>에서 확인할 수 있습니다.</p>
    </div>
  );
}
