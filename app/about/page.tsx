import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "소개",
  description: `${SITE.name}에서 전국 문화행사, 나들이, 여행코스, 캠핑장을 어떻게 모으고 확인하는지 안내합니다.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="prose-page">
      <h1>{SITE.name} 소개</h1>
      <p><strong>{SITE.name}</strong>은 이번 주말 어디로 갈지 고를 때 필요한 정보를 한곳에서 찾을 수 있도록 만든 서비스입니다. <Link href="/weekend">이번 주말 행사</Link>와 <Link href="/places">나들이 장소</Link>, <Link href="/course">여행코스</Link>, <Link href="/camping">캠핑장</Link>을 지역과 관심사로 살펴볼 수 있습니다. <Link href="/kids">아이와 갈 곳</Link>과 <Link href="/date">데이트 코스</Link>도 별도로 모았습니다.</p>
      <h2>정보는 어떻게 모으나요?</h2>
      <p>문화행사는 공공데이터포털을 통해 제공되는 한국문화정보원 자료를 활용합니다. 관광지·음식점·여행코스 등은 한국관광공사 TourAPI 자료를 사용하며, 캠핑장 정보는 고캠핑 기반 자료를 활용합니다. 각 상세페이지에는 제공된 일정·주소·요금·시설 등 확인 가능한 항목을 보여주고, 정보가 없는 항목은 임의로 채우지 않습니다.</p>
      <p>지역과 날짜, 유형을 골라 후보를 좁히고 관련 장소를 이어서 볼 수 있도록 정보를 정리합니다. 다만 데이터 수집 시점과 현장 상황은 다를 수 있습니다. 예약 가능 여부, 운영 시간, 요금, 휴무일은 출발 전에 공식 페이지나 운영기관에 다시 확인해 주세요.</p>
      <h2>무료 표시는 어떻게 읽나요?</h2>
      <p>무료라고 명시된 행사와 일부 대상만 무료인 행사는 구분해 표시합니다. 요금 정보가 없어 행사 유형으로 판단한 경우에는 <b>무료 추정</b>으로 표시합니다. 이 표시는 무료 입장을 보장하지 않습니다. 요금이 확인되지 않으면 확인 필요로 남깁니다.</p>
      <h2>정보 수정과 문의</h2>
      <p>일정이나 장소가 바뀌었거나 잘못된 정보를 발견했다면 <Link href="/contact">문의 페이지</Link> 또는 <a href={`mailto:${SITE.email}`}>{SITE.email}</a>로 행사명과 수정 내용을 보내주세요. 개인정보 처리와 서비스 이용에 관한 안내는 <Link href="/privacy">개인정보처리방침</Link>과 <Link href="/terms">이용약관</Link>에서 확인할 수 있습니다.</p>
      <p className="text-sm text-ink-faint">문화행사 데이터 출처: {SITE.source}</p>
    </div>
  );
}
