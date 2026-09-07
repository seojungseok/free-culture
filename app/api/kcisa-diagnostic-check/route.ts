import { createHash, timingSafeEqual } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const expires = Date.parse("2026-09-07T12:45:00Z");
const expected = Buffer.from("f72d872158aca15134384e388e93499bf52d2dd54927ad7931d0c3b3e9985c43", "hex");
let result: Promise<Record<string, unknown>> | undefined;
function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
export async function GET() { return reply({ error: "not_found" }, 404); }
async function diagnose(): Promise<Record<string, unknown>> {
  const key = process.env.KCISA_API_KEY?.trim();
  if (!key) return { error: "production_secret_unavailable" };
  const url = new URL("https://api.kcisa.kr/openapi/API_CNV_063/request");
  url.search = new URLSearchParams({ serviceKey: key, numOfRows: "1", pageNo: "1", areaNm: "서울", clNm: "한식" }).toString();
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
    const raw = await response.text();
    let parsed: any;
    let format: string;
    try { parsed = JSON.parse(raw); format = "JSON"; }
    catch {
      if (XMLValidator.validate(raw) !== true) return { httpStatus: response.status, parseable: false };
      parsed = new XMLParser({ ignoreAttributes: true, parseTagValue: false }).parse(raw);
      format = "XML";
    }
    const root = parsed?.response ?? parsed;
    const header = root?.header ?? root;
    const body = root?.body ?? root?.msgBody ?? root;
    const collection = body?.items?.item ?? body?.item ?? [];
    const items = Array.isArray(collection) ? collection : collection && typeof collection === "object" ? [collection] : [];
    const sample = items[0] ?? {};
    const safeName = (x: string) => /^[A-Za-z_][A-Za-z0-9_]{0,70}$/.test(x);
    const code = String(header?.resultCode ?? header?.code ?? "");
    return {
      httpStatus: response.status, format, parseable: true,
      apiCode: /^[A-Za-z0-9_-]{1,30}$/.test(code) ? code : null,
      totalCount: /^\d+$/.test(String(body?.totalCount ?? "")) ? Number(body.totalCount) : null,
      returnedCount: items.length, hasData: items.length > 0,
      rootFields: Object.keys(root ?? {}).filter(safeName),
      bodyFields: Object.keys(body ?? {}).filter(safeName),
      fields: Object.keys(sample).filter(safeName),
      nonEmptyFields: Object.keys(sample).filter(k => safeName(k) && sample[k] !== "" && sample[k] != null),
      fieldTypes: Object.fromEntries(Object.keys(sample).filter(safeName).map(k => [k, Array.isArray(sample[k]) ? "array" : typeof sample[k]])),
      query: { areaNm: "서울", clNm: "한식", numOfRows: 1 }
    };
  } catch { return { error: "upstream_request_failed" }; }
}
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "production" || Date.now() >= expires) return reply({ error: "not_found" }, 404);
  const supplied = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  if (!timingSafeEqual(supplied, expected)) return reply({ error: "not_found" }, 404);
  result ??= diagnose();
  return reply(await result);
}

