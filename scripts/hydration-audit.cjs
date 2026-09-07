// Isolated browser only; never attaches to a user's browser profile.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://localhost:3027";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/plan", "/weekend", "/saved"];
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: "ko-KR", timezoneId: "Asia/Seoul" });
    if (process.env.TEST_BROWSER_NOW) await context.clock.setFixedTime(new Date(process.env.TEST_BROWSER_NOW));
    if (process.env.TEST_LOCAL_ORIGIN) await context.route(new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/'), async route=>{
      const url=new URL(route.request().url());
      if(url.pathname.startsWith('/_next/static/')&&url.pathname.endsWith('.js')) await new Promise(r=>setTimeout(r,2000));
      const response=await route.fetch({url:process.env.TEST_LOCAL_ORIGIN+url.pathname+url.search});
      await route.fulfill({response});
    });
    // Do not inflate the existing visitor counter or send test analytics.
    await context.route(/abacus\.jasoncameron\.dev/, r => r.fulfill({contentType:"application/json",body:JSON.stringify({value:1})}));
    await context.route(/google-analytics\.com|googletagmanager\.com/, r => r.abort());
    for (const path of paths) {
      const page = await context.newPage(), errors = [];
      page.on("console", m => {if (/hydration|hydrated|#418|In HTML|cannot be a descendant/i.test(m.text())) errors.push(m.text());});
      page.on("pageerror", e => errors.push(e.message));
      const response = await page.goto(base + path, {waitUntil:"domcontentloaded",timeout:90000});
      await page.waitForTimeout(2500);
      console.log(JSON.stringify({path,status:response.status(),url:page.url(),h1:await page.locator("h1").allTextContents(),errors}));
      if (errors.length || response.status() !== 200 || new URL(page.url()).origin !== new URL(base).origin) process.exitCode = 1;
      await page.close();
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e.name+": "+e.message);process.exitCode=1;});
