"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 캠핑 페이지용 쿠팡 파트너스 다이나믹 배너 (반응형)
 *
 * - PC(>=768px): 680 x 140 (상품 여러 개, 꽉 참)
 * - 모바일(<768px): 320 x 140 (안 삐져나감)
 * - 화면 크기에 따라 자동 전환 (리사이즈 대응)
 * - 쿠팡 g.js 로딩 타이밍 처리 (크롬에서 배너 안 뜨는 문제 방지)
 * - 공정위 필수 고지 문구 포함
 *
 * 사용법:
 *   import CoupangCampingBanner from "@/components/CoupangCampingBanner";
 *   <CoupangCampingBanner />
 *
 * ⚠️ 공정위/쿠팡 정책
 *  - 고지 문구는 반드시 노출되어야 함 (제거 금지)
 *  - 쿠팡 다이나믹 배너는 방문자 관심 기반이라
 *    캠핑용품이 아닌 다른 상품이 뜰 수 있음 (쿠팡 특성)
 */

const COUPANG_ID = 1017864;
const TRACKING_CODE = "AF0215515";
const MOBILE_MAX = 767; // 이하이면 모바일 배너

export default function CoupangCampingBanner() {
  const boxRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  // 1) 쿠팡 g.js 로드 (한 번만). 객체 생성 완료 후 scriptReady = true
  useEffect(() => {
    if (window.PartnersCoupang) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector('script[src="https://ads-partners.coupang.com/g.js"]');
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      // 이미 로드 완료된 경우 대비
      if (window.PartnersCoupang) setScriptReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://ads-partners.coupang.com/g.js";
    s.async = true;
    s.onload = () => setScriptReady(true);
    document.body.appendChild(s);
  }, []);

  // 2) 화면 폭 감지 (PC/모바일)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 3) 배너 렌더링 (스크립트 준비 + 화면크기 확정 후)
  useEffect(() => {
    if (!scriptReady || !boxRef.current || !window.PartnersCoupang) return;

    // 이전 배너 비우고 새로 그림 (PC<->모바일 전환 시)
    boxRef.current.innerHTML = "";

    try {
      new window.PartnersCoupang.G({
        id: COUPANG_ID,
        template: "carousel",
        trackingCode: TRACKING_CODE,
        width: isMobile ? "320" : "680",
        height: "140",
        tsource: "",
        container: boxRef.current, // 이 div 안에 그리도록 지정
      });
    } catch (e) {
      // 일부 버전은 container 옵션 미지원 → 폴백
      new window.PartnersCoupang.G({
        id: COUPANG_ID,
        template: "carousel",
        trackingCode: TRACKING_CODE,
        width: isMobile ? "320" : "680",
        height: "140",
        tsource: "",
      });
    }
  }, [scriptReady, isMobile]);

  return (
    <div className="ccb-wrap">
      <div className="ccb-inner" ref={boxRef} />
      <p className="ccb-notice">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>

      <style jsx>{`
        .ccb-wrap {
          margin: 32px 0;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
        }
        .ccb-inner {
          display: flex;
          justify-content: center;
          max-width: 100%;
          overflow-x: auto;
        }
        .ccb-notice {
          margin: 8px 0 0;
          font-size: 11px;
          line-height: 1.5;
          color: #9aa5ab;
          font-family: "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
        }
      `}</style>
    </div>
  );
}
