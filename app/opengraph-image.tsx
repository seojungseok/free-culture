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

  const candidates = [...now]
    .filter((e) => e.imgUrl && /\.(jpe?g|png)$/i.test(e.imgUrl))
    .sort((a, b) => b.featuredScore - a.featuredScore)
    .slice(0, 14);
  const posters: string[] = [];
  for (const e of candidates) {
    if (posters.length >= 4) break;
    const d = await toDataUrl(e.imgUrl);
    if (d) posters.push(d);
  }

  const badge =
    todayFree || weekendCount
      ? `오늘 무료 ${todayFree.toLocaleString()}건 · 이번 주말 ${weekendCount.toLocaleString()}건`
      : "매일 자동 업데이트";

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#ffffff", fontFamily: "Pretendard" }}>
        {/* 왼쪽 텍스트 */}
        <div
          style={{
            width: 672,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          <div style={{ display: "flex" }}>
            <div style={{ fontSize: 23, fontWeight: 800, color: "#03C75A", background: "#E8F8EF", padding: "8px 16px", borderRadius: 999 }}>
              무료·저렴 문화행사
            </div>
          </div>
          <div style={{ fontSize: 74, fontWeight: 800, color: "#191919", letterSpacing: "-3px", marginTop: 22, lineHeight: 1 }}>
            주말에 뭐하지
          </div>
          <div style={{ fontSize: 30, color: "#555555", marginTop: 16 }}>
            무료로·저렴하게 즐기는 전국 문화생활
          </div>
          <div style={{ display: "flex", marginTop: 26 }}>
            <div style={{ fontSize: 27, fontWeight: 800, color: "#ffffff", background: "#03C75A", padding: "12px 24px", borderRadius: 999 }}>
              {badge}
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#888888", marginTop: 30 }}>mwohaji.kr</div>
        </div>

        {/* 오른쪽 포스터 카드 2x2 */}
        <div
          style={{
            width: 528,
            height: 630,
            display: "flex",
            flexWrap: "wrap",
            alignContent: "center",
            justifyContent: "center",
            gap: 16,
            padding: 26,
            background: "#F2FBF6",
          }}
        >
          {posters.map((src, i) => (
            <img key={i} src={src} width={222} height={274} style={{ width: 222, height: 274, objectFit: "cover", borderRadius: 18 }} />
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: font, weight: 800, style: "normal" }] }
  );
}
