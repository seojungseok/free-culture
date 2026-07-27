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
        {/* 1. 딥그린 → 차콜 대각 그라디언트 */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(135deg, #0F3D2E 0%, #163329 46%, #1A1A1A 100%)" }} />
        {/* 좌상단 은은한 라이트 */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "radial-gradient(60% 65% at 14% 16%, rgba(122,224,176,0.16) 0%, rgba(122,224,176,0) 55%)" }} />

        {/* 2. 대표 이미지 1장 (우측), 좌측으로 넓고 부드럽게 페이드(경계선 없이) */}
        {hero && <img src={hero} width={660} height={630} style={{ position: "absolute", right: 0, top: 0, width: 660, height: 630, objectFit: "cover" }} />}
        {/* 이미지 → 배경 melt (넓은 그라디언트로 경계 제거, 텍스트 영역은 불투명) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(90deg, #12352A 0%, #12352A 56%, rgba(18,50,40,0.6) 70%, rgba(18,50,40,0) 86%)" }} />
        {/* 우측 이미지 어둡게(가독성·절제) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,12,10,0) 66%, rgba(8,12,10,0.44) 100%)" }} />
        {/* 하단 비네트(깊이감) */}
        <div style={{ display: "flex", position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3) 100%)" }} />

        {/* 로고 (좌상단, 절제) */}
        <div style={{ display: "flex", alignItems: "center", position: "absolute", top: 52, left: 80 }}>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 99, background: MINT, marginRight: 11 }} />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.5px" }}>주말에뭐하지</div>
        </div>

        {/* 텍스트 블록 (좌측, 수직 중앙, 좌측 정렬) */}
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 80, top: 0, width: 780, height: 630, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 23, fontWeight: 500, color: "#B0B0B0", letterSpacing: "6px" }}>전국 무료·저렴 문화생활</div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: 16, letterSpacing: "-5px" }}>
            <div style={{ display: "flex", fontSize: 114, fontWeight: 800, color: "#FFFFFF", lineHeight: 1, paddingRight: 20 }}>주말에</div>
            <div style={{ display: "flex", fontSize: 114, fontWeight: 800, color: MINT, lineHeight: 1 }}>뭐하지?</div>
          </div>

          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.82)", letterSpacing: "0.5px", marginTop: 24 }}>문화행사 · 나들이 · 캠핑</div>

          {/* 고정 문구 — 다크 글래스 알약 (매일 바뀌는 숫자 대신) */}
          <div style={{ display: "flex", alignItems: "center", marginTop: 36, background: "rgba(18,26,22,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "13px 26px" }}>
            <div style={{ display: "flex", fontSize: 25, fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "0.2px" }}>이번 주말, 어디 갈지 여기서 정하세요</div>
          </div>
        </div>

        {/* 도메인 (우하단, 은은하게) */}
        <div style={{ display: "flex", position: "absolute", right: 56, bottom: 42, fontSize: 22, fontWeight: 500, color: "rgba(255,255,255,0.6)", letterSpacing: "1.5px" }}>mwohaji.kr</div>
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
