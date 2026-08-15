"use client";

import { useEffect, useState } from "react";

/**
 * 캠핑 페이지용 쿠팡 파트너스 다이나믹 배너 (반응형)
 *
 * - PC(>=768px): 680 x 140 (상품 여러 개, 꽉 참)
 * - 모바일(<768px): 320 x 140 (안 삐져나감)
 * - 화면 크기에 따라 자동 전환 (리사이즈 시 key 변경 → iframe 재로드)
 * - g.js 대신 iframe 직접 삽입: g.js 방식은 리퍼러가 잘려 PC(680)에서
 *   iframe이 0x0으로 접히는 문제가 있었음. referrerpolicy="unsafe-url" 필수.
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
const PC = { width: 680, height: 140 };
const MOBILE = { width: 320, height: 140 };

export default function CoupangCampingBanner() {
  // null = 아직 폭 미확정(SSR·마운트 직전). 폭이 정해진 뒤에만 iframe을 그려
  // 잘못된 크기로 광고를 한 번 더 호출하는 일을 막는다.
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const pick = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    pick();
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(pick, 200); // 리사이즈 중 과도한 재로드 방지
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  const size = isMobile === null ? null : isMobile ? MOBILE : PC;
  const src = size
    ? `https://ads-partners.coupang.com/widgets.html?id=${COUPANG_ID}&template=carousel&trackingCode=${TRACKING_CODE}&subId=&width=${size.width}&height=${size.height}&tsource=`
    : "";

  return (
    <div className="ccb-wrap">
      <div className="ccb-inner" style={{ minHeight: size ? size.height : 140 }}>
        {size && (
          <iframe
            key={size.width} /* PC<->모바일 전환 시 새 iframe으로 재로드 */
            src={src}
            width={size.width}
            height={size.height}
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            browsingtopics=""
            title="쿠팡 파트너스 광고"
            className="ccb-frame"
          />
        )}
      </div>
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
        .ccb-frame {
          display: block;
          border: 0;
          max-width: 100%;
          vertical-align: top;
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
