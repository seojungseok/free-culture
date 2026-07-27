import { ImageResponse } from "next/og";
import { getNow, getWeekend } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "주말에 뭐하지? · 전국 무료·저렴 문화행사";

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

  // 우측 콜라주용 포스터 4장 (2x2)
  const candidates = [...now]
    .filter((e) => e.imgUrl && /\.(jpe?g|png)$/i.test(e.imgUrl))
    .sort((a, b) => b.featuredScore - a.featuredScore)
    .slice(0, 16);
  const posters: string[] = [];
  for (const e of candidates) {
    if (posters.length >= 4) break;
    const d = await toDataUrl(e.imgUrl);
    if (d) posters.push(d);
  }
  const hasCollage = posters.length >= 4;

  const badge = `오늘 무료 ${todayFree.toLocaleString()}건 · 이번 주말 ${weekendCount.toLocaleString()}곳`;
  const shadow = "0 2px 10px rgba(0,0,0,0.30)";

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "linear-gradient(135deg,#04A85A 0%,#019149 55%,#04502C 100%)", fontFamily: "Pretendard" }}>
        {/* 우측 40% 포스터 콜라주 (2x2) */}
        {hasCollage && (
          <div style={{ display: "flex", flexWrap: "wrap", position: "absolute", top: 0, right: 0, width: 480, height: 630 }}>
            {posters.map((src, i) => (
              <img key={i} src={src} width={240} height={315} style={{ width: 240, height: 315, objectFit: "cover" }} />
            ))}
          </div>
        )}

        {/* 가로 그라데이션: 왼쪽은 진한 초록(텍스트 영역), 오른쪽 이음새는 부드럽게 투명 */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(90deg,#037A41 0%,#037A41 54%,rgba(3,110,60,0.78) 63%,rgba(4,50,28,0.0) 90%)" }} />

        {/* 좌측 텍스트 (흰색, 왼쪽 정렬) */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", position: "absolute", top: 0, left: 0, width: 720, height: 630, padding: "0 40px 0 72px" }}>
          <div style={{ display: "flex", fontSize: 25, fontWeight: 800, color: "#CFFCE4", letterSpacing: "0.5px", textShadow: shadow }}>
            전국 무료·저렴 문화생활
          </div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: "#ffffff", letterSpacing: "-4px", lineHeight: 1.02, marginTop: 16, textShadow: shadow }}>
            주말에 뭐하지?
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#EAFFF3", marginTop: 18, textShadow: shadow }}>
            문화행사 · 나들이
          </div>
          <div style={{ display: "flex", marginTop: 30 }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#04713F", background: "#ffffff", padding: "14px 30px", borderRadius: 999 }}>
              {badge}
            </div>
          </div>
        </div>

        {/* 우하단 도메인 */}
        <div style={{ display: "flex", position: "absolute", right: 40, bottom: 30, fontSize: 26, fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px", textShadow: shadow }}>
          mwohaji.kr
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 800, style: "normal" }] }
  );
}
