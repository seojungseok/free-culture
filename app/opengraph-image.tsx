import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "주말에 뭐하지? 전국 나들이와 문화행사";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f7fbff",
          color: "#102344",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 82px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#2378ed", fontSize: 26, fontWeight: 800, letterSpacing: 4 }}>WEEKEND PICK</div>
          <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, marginTop: 24 }}>주말에 뭐하지?</div>
          <div style={{ color: "#42526b", fontSize: 30, fontWeight: 600, marginTop: 20 }}>이번 주말 갈 만한 곳을 한곳에서</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {(["문화행사", "나들이", "여행코스", "캠핑"] as string[]).map((label) => (
            <div key={label} style={{ background: "#ffffff", border: "1px solid #dbe6f2", borderRadius: 18, color: "#102344", fontSize: 24, fontWeight: 800, padding: "18px 28px" }}>{label}</div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
