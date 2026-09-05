import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "주말에 뭐하지? 전국 나들이와 문화행사";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ background: "#0b1730", color: "#f8fafc", display: "flex", height: "100%", overflow: "hidden", padding: 46, position: "relative", width: "100%" }}>
        <div style={{ background: "#13284c", borderRadius: 36, display: "flex", height: 310, left: -100, opacity: 0.9, position: "absolute", top: -135, width: 480 }} />
        <div style={{ border: "1px solid #2e4e7c", borderRadius: 42, bottom: -170, display: "flex", height: 430, position: "absolute", right: -115, width: 430 }} />
        <div style={{ background: "#65a7ff", borderRadius: 999, display: "flex", height: 20, position: "absolute", right: 148, top: 84, width: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", position: "relative", width: "100%" }}>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <div style={{ color: "#8fc0ff", fontSize: 20, fontWeight: 800, letterSpacing: 5 }}>WEEKEND GUIDE</div>
            <div style={{ alignItems: "center", border: "1px solid #314c75", borderRadius: 999, color: "#d9e7fc", display: "flex", fontSize: 18, fontWeight: 700, padding: "10px 18px" }}>이번 주말의 발견</div>
          </div>
          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", marginTop: -5 }}>
            <div style={{ color: "#a9cfff", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>어디로 갈지 고민되는 주말</div>
            <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -5, lineHeight: 1.15, marginTop: 15, textAlign: "center" }}>주말에 뭐하지?</div>
            <div style={{ background: "#65a7ff", height: 4, marginTop: 26, width: 58 }} />
            <div style={{ color: "#c4d2e8", fontSize: 25, fontWeight: 600, marginTop: 22 }}>전국 문화행사부터 나들이, 여행코스까지</div>
          </div>
          <div style={{ alignItems: "center", display: "flex", gap: 12, justifyContent: "center" }}>
            {(["문화행사", "나들이", "여행코스", "캠핑"] as const).map((label, index) => (
              <div key={label} style={{ background: index === 0 ? "#f4f8ff" : "#172c50", border: index === 0 ? "1px solid #f4f8ff" : "1px solid #34517c", borderRadius: 999, color: index === 0 ? "#102344" : "#e4edf9", display: "flex", fontSize: 19, fontWeight: 800, padding: "12px 22px" }}>{label}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
