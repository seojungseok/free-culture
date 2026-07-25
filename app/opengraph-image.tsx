import { ImageResponse } from "next/og";
import { getNow, getWeekend } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "주말에뭐하지 · 무료로·저렴하게 즐기는 전국 문화생활";

const isFreeLike = (t: string) => t === "free" || t === "free_estimated" || t === "partial_free";

// 외부 이미지를 base64 data URL로 (ImageResponse 내부 로딩 실패 방지)
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Bold.otf"
  ).then((r) => r.arrayBuffer());

  const now = getNow();
  const todayFree = now.filter((e) => isFreeLike(e.priceType)).length;
  const weekendCount = getWeekend().length;

  // 이미지 있는 행사(주목도순) 후보 → 유효한 것 4장 (GIF는 렌더 불안정하여 제외)
  const candidates = [...now]
    .filter((e) => e.imgUrl && /\.(jpe?g|png)$/i.test(e.imgUrl))
    .sort((a, b) => b.featuredScore - a.featuredScore)
    .slice(0, 14);
  const collage: string[] = [];
  for (const e of candidates) {
    if (collage.length >= 4) break;
    const d = await toDataUrl(e.imgUrl);
    if (d) collage.push(d);
  }

  const badge =
    todayFree || weekendCount
      ? `오늘 무료 ${todayFree.toLocaleString()}건 · 이번 주말 ${weekendCount.toLocaleString()}건`
      : "매일 자동 업데이트";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
          fontFamily: "Pretendard",
        }}
      >
        {/* 콜라주 배경 (2x2) */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", flexWrap: "wrap" }}>
          {collage.map((src, i) => (
            <img key={i} src={src} width={600} height={315} style={{ width: 600, height: 315, objectFit: "cover" }} />
          ))}
        </div>

        {/* 어두운 오버레이 */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, background: "rgba(0,0,0,0.5)" }} />

        {/* 우상단 브랜드 도메인 */}
        <div style={{ position: "absolute", top: 34, right: 44, fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          mwohaji.kr
        </div>

        {/* 텍스트 (좌하단) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 72,
            color: "#ffffff",
          }}
        >
          <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: "-3px", lineHeight: 1 }}>
            주말에 뭐하지
          </div>
          <div style={{ fontSize: 33, marginTop: 16, color: "rgba(255,255,255,0.92)" }}>
            무료로·저렴하게 즐기는 전국 문화생활
          </div>
          <div style={{ display: "flex", marginTop: 26 }}>
            <div
              style={{
                display: "flex",
                fontSize: 29,
                fontWeight: 800,
                color: "#15803d",
                background: "#ffffff",
                padding: "12px 26px",
                borderRadius: 999,
              }}
            >
              {badge}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 800, style: "normal" }] }
  );
}
