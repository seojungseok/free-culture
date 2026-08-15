"use client";

import { useState, useEffect } from "react";

/**
 * 서울 숙소 제휴 배너 (세시간전 / 여기어때 CPS)
 *
 * 사용법:
 *   import SeoulStayBanner from "@/components/SeoulStayBanner";
 *   <SeoulStayBanner />
 *
 * 다른 지역 링크가 생기면 props로 교체:
 *   <SeoulStayBanner
 *      region="부산"
 *      href="https://3ha.in/r/부산링크ID"
 *   />
 *
 * ⚠️ 정책 주의 (세시간전/여기어때)
 *  - "여기어때" 브랜드명을 문구에 넣지 말 것 (수익 미지급 사유)
 *  - "광고" 표시 유지 (공정위)
 *  - 링크는 세시간전 대시보드에서 직접 발급한 URL만 사용
 *  - href는 반드시 rel="sponsored nofollow noopener" + target="_blank"
 */
export default function SeoulStayBanner({
  region = "서울",
  href = "https://3ha.in/r/628670",
}) {
  const [hover, setHover] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    // 날짜 자동 표시 (예: "8월 15일 기준 실시간 가격")
    const d = new Date();
    setToday(`${d.getMonth() + 1}월 ${d.getDate()}일`);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      aria-label={`${region} 숙소 최저가 보기 (광고)`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div className="ssb-root">
        <span className="ssb-accent-bar" />

        <div className="ssb-left">
          <span className="ssb-eyebrow">주말 나들이 · {region} 숙소 정보</span>
          <h2 className="ssb-title">{region} 여행, 숙소는 정하셨어요?</h2>
          <p className="ssb-sub">지금 바로 비교하고 가장 저렴한 숙소 찾기</p>
          <div className="ssb-trust">
            <span>가격 비교 무료</span>
            <span className="ssb-dot" />
            <span>취소 수수료 없는 숙소 다수</span>
            <span className="ssb-dot" />
            <span>지역별 시세 확인</span>
          </div>
        </div>

        <div className="ssb-right">
          <span className="ssb-badge">실시간 특가</span>
          <span
            className="ssb-cta"
            style={{ background: hover ? "#0b5a61" : "#0f6f77" }}
          >
            <span>{region} 숙소 최저가 보기</span>
            <span className="ssb-arrow">→</span>
          </span>
          <span className="ssb-date">{today} 기준 실시간 가격</span>
        </div>

        <span className="ssb-ad">광고</span>
      </div>

      <style jsx>{`
        .ssb-root {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #fbfdfd 0%, #f2f8f9 100%);
          border: 1px solid #dde8ea;
          border-radius: 10px;
          font-family: "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          column-gap: 48px;
          padding: 32px 56px;
          box-sizing: border-box;
          cursor: pointer;
        }
        .ssb-accent-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #0f766e;
        }
        .ssb-left {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-start;
          min-width: 0;
        }
        .ssb-eyebrow {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #0f766e;
        }
        .ssb-title {
          margin: 0;
          font-size: 34px;
          line-height: 1.24;
          font-weight: 900;
          color: #10262c;
          letter-spacing: -0.025em;
        }
        .ssb-sub {
          margin: 0;
          font-size: 17px;
          line-height: 1.5;
          font-weight: 500;
          color: #55737a;
        }
        .ssb-trust {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
          font-size: 13px;
          font-weight: 500;
          color: #7b959b;
        }
        .ssb-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #c4d5d9;
          display: block;
        }
        .ssb-right {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .ssb-badge {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #c2410c;
        }
        .ssb-cta {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 30px;
          border-radius: 10px;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.01em;
          white-space: nowrap;
          box-shadow: 0 5px 14px rgba(15, 90, 96, 0.2);
          transition: background 200ms ease, transform 200ms ease;
        }
        .ssb-root:hover .ssb-cta {
          transform: translateY(-1px);
        }
        .ssb-arrow {
          display: block;
          font-size: 17px;
          transition: transform 200ms ease;
        }
        .ssb-root:hover .ssb-arrow {
          transform: translateX(4px);
        }
        .ssb-date {
          font-size: 12px;
          font-weight: 500;
          color: #93aab0;
        }
        .ssb-ad {
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 10px;
          font-weight: 500;
          color: #adc2c6;
          border: 1px solid #dfeaec;
          border-radius: 3px;
          padding: 1px 5px;
          letter-spacing: 0.04em;
        }

        /* 태블릿 */
        @media (max-width: 768px) {
          .ssb-root {
            column-gap: 28px;
            padding: 26px 32px;
          }
          .ssb-title {
            font-size: 26px;
          }
          .ssb-sub {
            font-size: 15px;
          }
        }

        /* 모바일: 세로 스택으로 전환 */
        @media (max-width: 560px) {
          .ssb-root {
            grid-template-columns: 1fr;
            row-gap: 20px;
            padding: 24px 22px 26px;
            text-align: left;
          }
          .ssb-left {
            gap: 10px;
          }
          .ssb-title {
            font-size: 22px;
          }
          .ssb-sub {
            font-size: 14px;
          }
          .ssb-trust {
            gap: 8px;
            font-size: 12px;
          }
          .ssb-right {
            align-items: stretch;
            width: 100%;
          }
          .ssb-badge {
            text-align: left;
          }
          .ssb-cta {
            justify-content: center;
            padding: 16px 24px;
            font-size: 16px;
          }
          .ssb-date {
            text-align: center;
          }
        }
      `}</style>
    </a>
  );
}
