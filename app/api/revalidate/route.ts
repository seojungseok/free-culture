import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// 새 글 발행 시 해당 페이지만 즉시 캐시 갱신(재배포 없이). 대역폭 절감을 위해 상세 revalidate를
// 길게(30일) 두는 대신, 발행 파이프라인이 이 엔드포인트를 호출해 그 페이지만 새로고침한다.
//
// 사용:
//   curl -X POST "https://mwohaji.kr/api/revalidate?secret=$REVALIDATE_SECRET" \
//        -H "content-type: application/json" \
//        -d '{"paths":["/places/spot/134746","/"]}'
//
// 환경변수 REVALIDATE_SECRET 를 Vercel(Production)과 호출측(GitHub Actions)에 동일하게 설정.

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const raw = Array.isArray((body as { paths?: unknown }).paths)
    ? (body as { paths: unknown[] }).paths
    : (body as { path?: unknown }).path
      ? [(body as { path: unknown }).path]
      : [];
  const paths = raw.map(String).filter((p) => p.startsWith("/")).slice(0, 100);
  if (!paths.length) {
    return NextResponse.json({ ok: false, error: "no valid paths" }, { status: 400 });
  }
  for (const p of paths) revalidatePath(p);
  return NextResponse.json({ ok: true, revalidated: paths, at: new Date().toISOString() });
}
