// Read-only, low-volume check for the NAS release and 48-hour handover window.
// Never prints response bodies, environment values, or request headers.
const base = new URL(process.env.NAS_SMOKE_BASE || "http://127.0.0.1:3000");
const paths = [
  "/",
  "/events",
  "/places",
  "/city-tour",
  "/search?q=%EC%84%9C%EC%9A%B8",
  "/event/383591",
  "/api/pet-travel",
  "/robots.txt",
  "/sitemap.xml",
];

const results = [];
for (const path of paths) {
  const start = performance.now();
  try {
    const response = await fetch(new URL(path, base), {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    const body = path === "/event/383591" || path === "/sitemap.xml"
      ? await response.text()
      : null;
    const contentOk = path === "/event/383591"
      ? body?.includes('https://mwohaji.kr/event/383591')
      : path === "/sitemap.xml"
        ? body?.includes("https://mwohaji.kr/") && body?.includes("/event/")
        : true;
    results.push({ path, status: response.status, ms: Math.round(performance.now() - start), ok: response.status === 200 && contentOk });
  } catch (error) {
    results.push({ path, status: null, ms: Math.round(performance.now() - start), ok: false, error: error?.name || "RequestError" });
  }
}

console.log(JSON.stringify({ timestamp: new Date().toISOString(), ok: results.every((result) => result.ok), results }));
if (results.some((result) => !result.ok)) process.exitCode = 1;
