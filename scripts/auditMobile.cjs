// Run with PLAYWRIGHT_MODULE set to an installed Playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:3027";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/events", "/kids", "/food", "/places"];

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const results = [];
  try {
    for (const width of [320, 375]) {
      const context = await browser.newContext({ viewport: { width, height: 812 }, locale: "ko-KR" });
      await context.route(/abacus\.jasoncameron\.dev/, (route) => route.fulfill({ contentType: "application/json", body: '{"value":1}' }));
      await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort());
      for (const route of paths) {
        const page = await context.newPage();
        const errors = [], brokenImages = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (/hydration|hydrated|#418|cannot be a descendant/i.test(message.text())) errors.push(message.text());
        });
        page.on("response", (response) => {
          if (response.request().resourceType() === "image" && response.status() >= 400)
            brokenImages.push({ status: response.status(), url: response.url() });
        });
        const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90000 });
        await page.waitForTimeout(1200);
        const layout = await page.evaluate(() => {
          const rect = (selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const bounds = element.getBoundingClientRect();
            return { left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height };
          };
          return {
            viewport: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            h1: rect("h1"),
            header: rect("header"),
            footer: rect("footer"),
            menuButton: rect("header summary"),
            searchButton: rect('header a[aria-label="검색"]'),
          };
        });
        const overflow = layout.scrollWidth > width + 1 || [layout.h1, layout.header, layout.footer]
          .filter(Boolean).some((rect) => rect.left < -1 || rect.right > width + 1);
        const smallNavigation = [layout.menuButton, layout.searchButton]
          .filter(Boolean).some((rect) => rect.width < 40 || rect.height < 40);
        const result = { width, route, status: response.status(), overflow, smallNavigation, brokenImages, errors, layout };
        results.push(result);
        console.log(JSON.stringify(result));
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (results.some((result) => result.status !== 200 || result.overflow || result.smallNavigation || result.brokenImages.length || result.errors.length)) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
