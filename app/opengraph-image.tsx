import { ImageResponse } from "next/og";
import { getFeatured } from "@/lib/data";
import { getAllCamps } from "@/lib/camping";
import { getAllPlaces } from "@/lib/tour";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "주말에 뭐하지? · 전국 무료·저렴 문화행사·나들이·캠핑";

const MINT = "#6EE7A8"; // 포인트 컬러 딱 하나

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
  const [extraBold, medium] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-ExtraBold.otf").then((r) => r.arrayBuffer()),
    fetch("https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Medium.otf").then((r) => r.arrayBuffer()),
  ]);

  // 대표 이미지 1장 — 글램핑(감성) → 관광지 사진 → 추천 행사 순으로 첫 성공분
  const candidates = [
    ...getAllCamps().filter((c) => c.image && c.types.includes("글램핑")).slice(0, 6).map((c) => c.image),
    ...getAllPlaces().filter((p) => p.type === "12" && p.image).slice(0, 8).map((p) => p.image),
    ...getFeatured(6).map((e) => e.imgUrl).filter(Boolean) as string[],
  ];
  let hero: string | null = null;
  for (const u of candidates) {
    hero = await toDataUrl(u);
    if (hero) break;
  }

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", fontFamily: "Pretendard" }}>
        {/* 0. 폴백 배경(이미지 로드 실패 대비) — 딥그린→차콜 */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(135deg, #0F3D2E 0%, #163329 46%, #1A1A1A 100%)" }} />
        {/* 1. 대표 이미지 풀블리드 (좌우 분할 없음) */}
        {hero && <img src={hero} width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />}
        {/* 2. 어두운 오버레이 — 좌측 거의 불투명 → 우측 옅게 (Satori는 알파를 옅게 렌더 → 값 세게) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(4,10,7,0.99) 0%, rgba(4,10,7,0.97) 44%, rgba(6,13,9,0.66) 66%, rgba(8,16,11,0.22) 100%)" }} />
        {/* 전체 한 겹 더(대비 확보) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 74%)" }} />
        {/* 3. 상·하단 살짝 어둡게(로고·URL 가독성 + 깊이) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.42) 100%)" }} />

        {/* 로고 (좌상단, 절제) */}
        <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 52, left: 80 }}>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 99, background: MINT, marginRight: 11 }} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.5px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>주말에뭐하지</div>
        </div>

        {/* 텍스트 블록 (좌측, 수직 중앙, 전부 흰색) */}
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 80, top: 0, width: 720, height: 630, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 23, fontWeight: 500, color: "#D0D0D0", letterSpacing: "6px", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>전국 무료·저렴 문화생활</div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: 16, letterSpacing: "-5px" }}>
            <div style={{ display: "flex", fontSize: 116, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, paddingRight: 20, textShadow: "0 3px 18px rgba(0,0,0,0.55)" }}>주말에</div>
            <div style={{ display: "flex", fontSize: 116, fontWeight: 800, color: MINT, lineHeight: 1, textShadow: "0 3px 18px rgba(0,0,0,0.5)" }}>뭐하지?</div>
          </div>

          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "#FFFFFF", letterSpacing: "0.5px", marginTop: 24, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>문화행사 · 나들이 · 캠핑</div>

          {/* 고정 문구 — 알약 없이 흰 텍스트 (어두운 오버레이 위) */}
          <div style={{ display: "flex", fontSize: 25, fontWeight: 500, color: "rgba(255,255,255,0.88)", letterSpacing: "0.2px", marginTop: 26, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}>이번 주말, 어디 갈지 여기서 정하세요</div>
        </div>

        {/* 도메인 (우하단, 은은하게) */}
        <div style={{ display: "flex", position: "absolute", right: 56, bottom: 42, fontSize: 22, fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "1.5px", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>mwohaji.kr</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: extraBold, weight: 800, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
