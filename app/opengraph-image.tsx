import { ImageResponse } from "next/og";
import { getNow, getWeekend } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "주말에뭐하지 · 무료로·저렴하게 즐기는 전국 문화생활";

const isFreeLike = (t: string) => t === "free" || t === "free_estimated" || t === "partial_free";

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

  // 배경 콜라주용 포스터 6장 (3x2)
  const candidates = [...now]
    .filter((e) => e.imgUrl && /\.(jpe?g|png)$/i.test(e.imgUrl))
    .sort((a, b) => b.featuredScore - a.featuredScore)
    .slice(0, 20);
  const posters: string[] = [];
  for (const e of candidates) {
    if (posters.length >= 6) break;
    const d = await toDataUrl(e.imgUrl);
    if (d) posters.push(d);
  }
  const hasCollage = posters.length >= 3;

  const badge = `오늘 무료 ${todayFree.toLocaleString()}건 · 이번 주말 ${weekendCount.toLocaleString()}곳`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "linear-gradient(135deg,#03C75A 0%,#019149 55%,#04502C 100%)", fontFamily: "Pretendard" }}>
        {/* 배경 포스터 콜라주 */}
        {hasCollage && (
          <div style={{ display: "flex", flexWrap: "wrap", position: "absolute", top: 0, left: 0, width: 1200, height: 630 }}>
            {posters.map((src, i) => (
              <img key={i} src={src} width={400} height={315} style={{ width: 400, height: 315, objectFit: "cover" }} />
            ))}
          </div>
        )}

        {/* 어둡게 + 브랜드 그린 오버레이 (포스터는 은은히 비침) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(4,20,12,0.42) 0%,rgba(4,20,12,0.30) 45%,rgba(3,60,32,0.55) 100%)" }} />

        {/* 중앙 텍스트 패널 (스크림으로 가독성 확보) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "44px 60px 40px",
              borderRadius: 34,
              background: "rgba(10,16,12,0.60)",
              border: "2px solid rgba(255,255,255,0.14)",
            }}
          >
            <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: "#0B2A18", background: "#8FF0BB", padding: "8px 20px", borderRadius: 999 }}>
              전국 무료·저렴 문화생활
            </div>
            <div style={{ display: "flex", fontSize: 94, fontWeight: 800, color: "#ffffff", letterSpacing: "-4px", marginTop: 20, lineHeight: 1 }}>
              주말에 뭐하지?
            </div>
            <div style={{ display: "flex", fontSize: 31, fontWeight: 700, color: "#E8FFF2", marginTop: 18 }}>
              문화행사 · 아이와 가볼만한 곳을 매일 새로
            </div>
            <div style={{ display: "flex", marginTop: 30 }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#04502C", background: "#ffffff", padding: "14px 30px", borderRadius: 999 }}>
                {badge}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 27, fontWeight: 800, color: "#ffffff", marginTop: 26, letterSpacing: "0.5px" }}>
            mwohaji.kr
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 800, style: "normal" }] }
  );
}
