const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://localhost:3027';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [320,360,375,390,430,1440]){
const ctx=await browser.newContext({viewport:{width,height:900},locale:'ko-KR',timezoneId:'Asia/Seoul'});
await ctx.route(/abacus\.jasoncameron\.dev/,r=>r.fulfill({contentType:'application/json',body:'{"value":1}'}));
await ctx.route(/google-analytics\.com|googletagmanager\.com/,r=>r.abort());
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/hydration|#418|cannot be a descendant/i.test(m.text()))errors.push(m.text());});
const check=async()=>{await page.waitForTimeout(500);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+width);};
assert.equal((await page.goto(base+'/city-tour')).status(),200);await check();
assert.equal(await page.locator('main article').count(),20);
await page.getByRole('searchbox').fill('부산');assert(await page.locator('main article').count()>0);
await page.locator('main article a').first().click();await page.waitForURL(/city-tour\/[a-f0-9]+$/);await check();
const url=page.url();assert.equal(await page.locator('h1').count(),1);
assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),url.replace(base,'https://mwohaji.kr'));
await page.getByRole('button',{name:'보관함에 담기',exact:true}).click();
await page.reload();await check();
await page.goto(base+'/saved');await page.getByRole('button',{name:'삭제',exact:true}).waitFor();
assert.equal(await page.locator('article').count(),1);await check();
await page.reload();await page.getByRole('button',{name:'삭제',exact:true}).click();await page.getByRole('button',{name:'삭제 확인',exact:true}).click();await page.reload();
assert.equal(await page.locator('article').count(),0);
await page.goto(url);await page.goBack();await check();
assert.deepEqual(errors,[]);console.log(JSON.stringify({width,pass:true,errors}));await ctx.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
