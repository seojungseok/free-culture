import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "주말에뭐하지 · 무료로·저렴하게 즐기는 전국 문화생활";

// 기본 OG 이미지 (메인/목록용). 행사 상세는 각 포스터로 대체됨.
export default async function OpengraphImage() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Bold.otf"
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #03C75A 0%, #02A94D 100%)",
          color: "#ffffff",
          padding: "0 96px",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ fontSize: 116, fontWeight: 800, letterSpacing: "-4px" }}>
          주말에뭐하지
        </div>
        <div style={{ fontSize: 48, marginTop: 22, opacity: 0.97 }}>
          무료로·저렴하게 즐기는 전국 문화생활
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 60 }}>
          {["무료 전시", "공연", "축제", "매일 업데이트"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                fontSize: 32,
                padding: "12px 28px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 800, style: "normal" }] }
  );
}
