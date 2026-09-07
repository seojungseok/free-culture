import { createHash, timingSafeEqual } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const expires = Date.parse("2026-09-07T13:00:00Z");
const expected = Buffer.from("9a5b497557c8c21cd1d36d13761e1f7fd838914fe54da6fb51f67de7d9432d7f", "hex");
let result: Promise<Record<string, unknown>> | undefined;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
export async function GET() { return reply({ error: "not_found" }, 404); }
async function diagnose(): Promise<Record<string, unknown>> {
  const key = process.env.KCISA_API_KEY?.trim();
  if (!key) return { error: "production_secret_unavailable" };
  const url = new URL("https://api.kcisa.kr/openapi/API_CNV_063/request");
  url.search = new URLSearchParams({ serviceKey: key, numOfRows: "1", pageNo: "1", areaNm: "서울", clNm: "한식" }).toString();
  const requestChecks = {
    requiredParametersPresent: ["serviceKey", "numOfRows", "pageNo", "areaNm", "clNm"].every(k => !!url.searchParams.get(k)),
    keyEncodingRoundTrip: url.searchParams.get("serviceKey") === key,
    koreanEncodingRoundTrip: url.searchParams.get("areaNm") === "서울" && url.searchParams.get("clNm") === "한식",
    keyContainsPercentEscape: /%[0-9a-f]{2}/i.test(key),
    timeoutMs: 20000
  };
  const started = Date.now();
  let httpStatus: number | null = null;
  let phase = "fetch";
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
    httpStatus = response.status;
    phase = "read_body";
    const raw = await response.text();
    phase = "parse";
    let parsed: any;
    let format: string;
    try { parsed = JSON.parse(raw); format = "JSON"; }
    catch {
      if (XMLValidator.validate(raw) !== true) return { httpStatus, parseable: false, elapsedMs: Date.now() - started, requestChecks };
      parsed = new XMLParser({ ignoreAttributes: true, parseTagValue: false }).parse(raw); format = "XML";
    }
    const root = parsed?.response ?? parsed;
    const header = root?.header ?? root;
    const body = root?.body ?? root?.msgBody ?? root;
    const collection = body?.items?.item ?? body?.item ?? [];
    const items = Array.isArray(collection) ? collection : collection && typeof collection === "object" ? [collection] : [];
    const sample = items[0] ?? {};
    const safe = (x: string) => /^[A-Za-z_][A-Za-z0-9_]{0,70}$/.test(x);
    const code = String(header?.resultCode ?? header?.code ?? "");
    return {
      httpStatus, format, parseable: true, elapsedMs: Date.now() - started, requestChecks,
      apiCode: /^[A-Za-z0-9_-]{1,30}$/.test(code) ? code : null,
      hasData: items.length > 0, returnedCount: items.length,
      rootFields: Object.keys(root ?? {}).filter(safe), bodyFields: Object.keys(body ?? {}).filter(safe),
      fields: Object.keys(sample).filter(safe),
      nonEmptyFields: Object.keys(sample).filter(k => safe(k) && sample[k] !== "" && sample[k] != null)
    };
  } catch (error: any) {
    const entries: { name: string | null; code: string | null }[] = [];
    const visit = (e: any, depth = 0) => {
      if (!e || depth > 3) return;
      const safeToken = (v: unknown) => typeof v === "string" && /^[A-Za-z0-9_]{1,80}$/.test(v) ? v : null;
      entries.push({ name: safeToken(e.name), code: safeToken(e.code) });
      visit(e.cause, depth + 1);
      if (Array.isArray(e.errors)) for (const child of e.errors.slice(0, 3)) visit(child, depth + 1);
    };
    visit(error);
    const tags = entries.map(x => (x.name ?? "") + " " + (x.code ?? "")).join(" ");
    const category = /TLS|SSL|CERT|SELF_SIGNED|VERIFY_LEAF/.test(tags) ? "TLS" :
      /ENOTFOUND|EAI_AGAIN|EAI_FAIL/.test(tags) ? "DNS" :
      /TimeoutError|ETIMEDOUT|TIMEOUT|AbortError/.test(tags) ? "timeout" :
      /ECONNREFUSED|ECONNRESET|ENETUNREACH|EHOSTUNREACH/.test(tags) ? "network_connection" : "unclassified";
    return { error: "request_failed", httpStatus, phase, elapsedMs: Date.now() - started, category, errors: entries, requestChecks };
  }
}
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "production" || Date.now() >= expires) return reply({ error: "not_found" }, 404);
  const supplied = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  if (!timingSafeEqual(supplied, expected)) return reply({ error: "not_found" }, 404);
  result ??= diagnose();
  return reply(await result);
}
