import { createHash, timingSafeEqual } from "node:crypto";
import { lookup, resolve4, resolve6, resolveCname } from "node:dns/promises";
import https from "node:https";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export const runtime = "nodejs";
export const preferredRegion = "icn1";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const endpointHost = "api.kcisa.kr";
const expires = Date.parse("2026-09-07T14:00:00Z");
const expected = Buffer.from("f4adbf61425a98c3db8b6fffc95f285fcb1f4e3403f6974b53839516c11a350e", "hex");

const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

export async function GET() { return reply({ error: "not_found" }, 404); }

const errorInfo = (error: unknown) => {
  const e = error as { name?: unknown; code?: unknown };
  const safe = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_]{1,80}$/.test(value) ? value : null;
  return { name: safe(e?.name), code: safe(e?.code) };
};

async function publicIPv4() {
  const response = await fetch("https://cloudflare-dns.com/dns-query?name=api.kcisa.kr&type=A", {
    headers: { accept: "application/dns-json" },
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });
  const data = await response.json() as { Status?: unknown; Answer?: Array<{ type?: unknown; data?: unknown }> };
  const addresses = (data.Answer ?? []).filter(a => a.type === 1 && typeof a.data === "string" && /^\d{1,3}(\.\d{1,3}){3}$/.test(a.data)).map(a => a.data!);
  return { resolver: "cloudflare-dns.com", status: data.Status, addresses };
}

async function callKCISAWithPublicDNS(key: string) {
  const query = new URLSearchParams({ serviceKey: key, numOfRows: "1", pageNo: "1", areaNm: "서울", clNm: "한식" });
  const dns = await publicIPv4();
  const address = String(dns.addresses[0] ?? "");
  if (!address) return { ok: false, phase: "public_dns", publicDnsResolver: dns.resolver, publicDnsStatus: dns.status, publicARecords: dns.addresses.length };

  const result = await new Promise<{ status: number; raw: string }>((resolve, reject) => {
    const request = https.request({
      hostname: endpointHost,
      path: "/openapi/API_CNV_063/request?" + query.toString(),
      method: "GET",
      family: 4,
      servername: endpointHost,
      headers: { accept: "application/json, application/xml, text/xml;q=0.9" },
      lookup: (hostname, options, callback) => {
        if (hostname !== endpointHost) return callback(Object.assign(new Error("unexpected_hostname"), { code: "EHOSTUNREACH" }), "", 4);
        callback(null, address, 4);
      },
      timeout: 20000,
    }, response => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { raw += chunk; });
      response.on("end", () => resolve({ status: response.statusCode ?? 0, raw }));
    });
    request.on("timeout", () => request.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    request.on("error", reject);
    request.end();
  });

  let parsed: any;
  let format: string;
  try { parsed = JSON.parse(result.raw); format = "JSON"; }
  catch {
    if (XMLValidator.validate(result.raw) !== true) return { ok: true, httpStatus: result.status, parseable: false, publicARecords: dns.addresses.length };
    parsed = new XMLParser({ ignoreAttributes: true, parseTagValue: false }).parse(result.raw);
    format = "XML";
  }
  const root = parsed?.response ?? parsed;
  const header = root?.header ?? root;
  const body = root?.body ?? root?.msgBody ?? root;
  const rows = body?.items?.item ?? body?.item ?? [];
  const items = Array.isArray(rows) ? rows : rows && typeof rows === "object" ? [rows] : [];
  const sample = items[0] ?? {};
  const safeField = (name: string) => /^[A-Za-z_][A-Za-z0-9_]{0,80}$/.test(name);
  const code = String(header?.resultCode ?? header?.code ?? "");
  return {
    ok: true, httpStatus: result.status, format, parseable: true, publicDnsResolver: dns.resolver, publicARecords: dns.addresses.length,
    apiCode: /^[A-Za-z0-9_-]{1,30}$/.test(code) ? code : null,
    hasData: items.length > 0, returnedCount: items.length,
    rootFields: Object.keys(root ?? {}).filter(safeField),
    bodyFields: Object.keys(body ?? {}).filter(safeField),
    fields: Object.keys(sample).filter(safeField),
    nonEmptyFields: Object.keys(sample).filter(k => safeField(k) && sample[k] !== "" && sample[k] != null),
  };
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "production" || Date.now() >= expires) return reply({ error: "not_found" }, 404);
  const supplied = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  if (!timingSafeEqual(supplied, expected)) return reply({ error: "not_found" }, 404);

  const key = process.env.KCISA_API_KEY?.trim();
  if (!key) return reply({ error: "production_secret_unavailable" });

  const started = Date.now();
  const [nodeLookup, nodeA, nodeAAAA, nodeCname] = await Promise.allSettled([
    lookup(endpointHost, { all: true, verbatim: true }),
    resolve4(endpointHost), resolve6(endpointHost), resolveCname(endpointHost)
  ]);
  const summarise = (value: PromiseSettledResult<unknown>) => value.status === "fulfilled"
    ? { ok: true, count: Array.isArray(value.value) ? value.value.length : 1 }
    : { ok: false, ...errorInfo(value.reason) };

  try {
    const kcisa = await callKCISAWithPublicDNS(key);
    return reply({
      runtime: process.release.name, node: process.versions.node, region: process.env.VERCEL_REGION ?? null,
      requestedRegion: "icn1", nativeDns: { lookup: summarise(nodeLookup), A: summarise(nodeA), AAAA: summarise(nodeAAAA), CNAME: summarise(nodeCname) },
      elapsedMs: Date.now() - started, kcisa,
    });
  } catch (error) {
    return reply({
      runtime: process.release.name, node: process.versions.node, region: process.env.VERCEL_REGION ?? null,
      requestedRegion: "icn1", nativeDns: { lookup: summarise(nodeLookup), A: summarise(nodeA), AAAA: summarise(nodeAAAA), CNAME: summarise(nodeCname) },
      elapsedMs: Date.now() - started, kcisa: { ok: false, phase: "https_with_public_dns", ...errorInfo(error) },
    });
  }
}
