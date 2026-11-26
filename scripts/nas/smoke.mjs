// Read-only, low-volume check for the NAS release and 48-hour handover window.
// Never prints response bodies, environment values, or request headers.
const base = new URL(process.env.NAS_SMOKE_BASE || "http://127.0.0.1:3000");
const adsOnly=process.argv.includes('--ads-only');
const paths = adsOnly?['/', '/event/383591','/api/affiliate/toss']:[
  "/",
  "/events",
  "/places",
  "/weekend",
  "/places/spot/130344",
  "/city-tour",
  "/search?q=%EC%84%9C%EC%9A%B8",
  "/event/383591",
  "/api/pet-travel",
  "/robots.txt",
  "/sitemap.xml",
  "/api/site-status",
  "/api/visitors",
  "/rss.xml",
  "/places/spot/missing-place-for-test",
];

const results = [];
for (const path of paths) {
  const start = performance.now();
  try {
    const response = await fetch(new URL(path, base), {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    const body = ["/","/event/383591","/sitemap.xml","/api/site-status","/places/spot/130344","/api/visitors","/rss.xml","/api/affiliate/toss"].includes(path)
      ? await response.text()
      : null;
    const contentOk = path === '/'
      ? /data-seasonal-hero[^>]*>(?:(?!<nav\b)[\s\S])*?<a\b(?=[^>]*\brel="[^"]*\bsponsored\b)(?=[^>]*\bhref="https:\/\/toss\.shopping\/)[^>]*>/.test(body)
      : path === '/api/affiliate/toss'
      ? (()=>{try{
          const feed=JSON.parse(body),now=Date.now(),age=now-Date.parse(feed.checkedAt);
          return age>=0&&age<6*3600000&&Array.isArray(feed.products)&&feed.products.some(p=>
            p.price>0&&!p.isSoldOut&&(!p.endAt||Date.parse(p.endAt)>now)&&/^https:\/\/toss\.shopping\/_m\//.test(p.links?.home));
        }catch{return false;}})()
      : path === '/places/spot/missing-place-for-test'
      ? response.headers.get('x-robots-tag')?.includes('noindex')
      : path === '/rss.xml'
      ? response.headers.get('content-type')?.includes('application/rss+xml') && body?.includes('<rss version="2.0"') && body?.includes('<channel>') && body?.includes('</channel></rss>') &&
        (body.includes('<item>') ? body.includes('/experiences/') && body.includes('<content:encoded>') : body.includes('<atom:link') && body.includes('<lastBuildDate>'))
      : path === '/api/visitors'
      ? (()=>{try{const value=JSON.parse(body);return response.headers.get('x-visitor-store')==='persistent-v1'&&Number.isSafeInteger(value.total)&&Number.isSafeInteger(value.today)&&value.total>=value.today&&value.today>=0;}catch{return false;}})()
      : path === '/api/site-status'
      ? (()=>{try{const result=JSON.parse(body);return result.ready===true&&(!process.env.EXPECTED_COMMIT||result.commit===process.env.EXPECTED_COMMIT);}catch{return false;}})()
      : path === '/places/spot/130344'
      ? body?.includes('https://sokchocul.or.kr/')&&!body?.includes('sokcho-culture.com')
      : path === "/event/383591"
      ? body?.includes('https://mwohaji.kr/event/383591')&&(/<span\b[^>]*\bdata-article-deal-slot=/.test(body)||/data-article-products[^>]*>[\s\S]*?<a\b(?=[^>]*\bdata-product=)(?=[^>]*\bhref="https:\/\/toss\.shopping\/_m\/)(?=[^>]*\bsponsored\b)[^>]*>/.test(body))
      : path === "/sitemap.xml"
        ? body?.includes("https://mwohaji.kr/") && body?.includes("/event/")
        : true;
    const expectedStatus = path === '/places/spot/missing-place-for-test' ? 404 : 200;
    results.push({ path, status: response.status, ms: Math.round(performance.now() - start), ok: response.status === expectedStatus && contentOk });
    if(path==='/rss.xml'&&contentOk&&!body.includes('<item>'))console.warn('RSS has no currently publishable programmes');
  } catch (error) {
    results.push({ path, status: null, ms: Math.round(performance.now() - start), ok: false, error: error?.name || "RequestError" });
  }
}

console.log(JSON.stringify({ timestamp: new Date().toISOString(), ok: results.every((result) => result.ok), results }));
if (results.some((result) => !result.ok)) process.exitCode = 1;
