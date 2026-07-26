import { NextResponse } from "next/server";
import { getTourById } from "@/lib/tour";
import { fetchPlaceOverview } from "@/lib/tourDetail";
// Node 전용 생성 로직(.mjs) 재사용
import { buildPrompt, callGemini, qualityCheck } from "@/scripts/lib/articleGen.mjs";

// 임시 미리보기 엔드포인트 — Vercel의 GEMINI_API_KEY로 실제 글 1편 생성. 토큰(=DATA_GO_KR_KEY)으로 잠금.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const token = req.headers.get("x-preview-token");
  if (!token || token !== process.env.DATA_GO_KR_KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY 없음(Vercel 환경변수 확인)" }, { status: 500 });
  }
  const id = new URL(req.url).searchParams.get("id") || "126511";
  const spot = getTourById(id);
  if (!spot) return NextResponse.json({ error: "장소 없음" }, { status: 404 });

  const { overview } = await fetchPlaceOverview(id);
  try {
    const { text, sources } = await callGemini(buildPrompt(spot, overview), {
      apiKey: geminiKey,
      grounding: !overview,
    } as Record<string, unknown>);
    const check = qualityCheck(text, { overview });
    return NextResponse.json({
      id,
      title: spot.title,
      area: spot.area,
      type: spot.type,
      hadOverview: Boolean(overview),
      length: check.len,
      pass: check.ok,
      reason: check.reason,
      sources,
      content: text,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
