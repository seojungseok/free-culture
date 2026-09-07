import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SITE.name}의 개인정보처리방침입니다.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="prose-page">
      <h1>개인정보처리방침</h1>
      <p>
        {SITE.name}(이하 &ldquo;서비스&rdquo;)은 이용자의 개인정보를 소중히 여기며,
        관련 법령을 준수합니다. 본 방침은 서비스가 어떤 정보를 어떻게 다루는지
        설명합니다.
      </p>

      <h2>1. 수집하는 정보</h2>
      <p>
        서비스는 회원가입 없이 이용할 수 있으며, 이름·연락처 등 개인을 식별할 수
        있는 정보를 직접 수집하지 않습니다. 다만 서비스 개선과 광고 제공을 위해
        아래 정보가 자동으로 수집될 수 있습니다.
      </p>
      <ul>
        <li>접속 기기·브라우저 정보, 방문 페이지 등 일반적인 이용 기록</li>
        <li>쿠키를 통한 방문 분석 정보</li>
      </ul>
      <p>
        서비스는 <strong>개인위치정보를 수집하거나 이용하지 않습니다.</strong>{" "}
        지역 정보는 이용자가 직접 지역을 선택하는 방식으로만 제공됩니다.
      </p>

      <h2>2. 광고 및 쿠키 (Google AdSense)</h2>
      <p>
        서비스는 Google AdSense를 통해 광고를 게재할 수 있습니다. Google을 포함한
        제3자 광고 사업자는 쿠키를 사용하여 이용자의 방문 기록을 바탕으로 맞춤형
        광고를 제공할 수 있습니다. 이용자는 Google 광고 설정
        (<a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
          adssettings.google.com
        </a>)에서 맞춤 광고를 해제할 수 있으며,
        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">
          {" "}www.aboutads.info
        </a>{" "}
        에서 제3자 쿠키 사용을 거부할 수 있습니다.
      </p>

      <h2>3. 쿠키 관리</h2>
      <p>
        이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.
        다만 일부 기능의 이용이 제한될 수 있습니다.
      </p>

      <h2>4. 정보의 제3자 제공</h2>
      <p>
        서비스는 법령에 근거하거나 이용자의 동의가 있는 경우를 제외하고 이용자
        정보를 제3자에게 제공하지 않습니다.
      </p>

      <h2>5. 문의</h2>
      <p>
        개인정보 관련 문의는 <a href="/contact">문의 페이지</a> 또는{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> 로 접수할 수 있습니다.
      </p>

      <p className="text-sm text-ink-faint">시행일: 2026년 7월 25일</p>
    </div>
  );
}
