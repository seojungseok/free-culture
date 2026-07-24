import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          DEFAULT: "#191919",
          soft: "#555555",
          faint: "#8E8E8E",
          dim: "#ADADAD",
        },
        // 네이버 그린 기반 팔레트
        free: "#03C75A", // Primary — 무료·선택·핵심 액션
        freedark: "#02A94D", // hover/강조
        freelight: "#E8F8EF", // 옅은 초록 점
        tint: "#F2FBF6", // 히어로 배경 틴트
        paid: "#FF6B35", // Accent — 조건부무료
        danger: "#FF3B30", // 오늘/내일 마감
        brandblue: "#2D7FF9", // 1만원 이하
        line: "#EEEEEE",
        panel: "#FAFAFA", // 구역 띠 배경
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,18,20,0.04), 0 8px 24px rgba(17,18,20,0.06)",
        cardhover: "0 8px 16px rgba(17,18,20,0.10), 0 24px 48px rgba(17,18,20,0.16)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "pop-in": "pop-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
