const assert=require('node:assert/strict');const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.argv[2]||'http://localhost:3027';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [320,360,375,390,430,1440]){
const context=await browser.newContext({viewport:{width,height:900},timezoneId:width===360?'America/Los_Angeles':'Asia/Seoul'});
await context.route(/abacus\.jasoncameron\.dev/,r=>r.fulfill({contentType:'application/json',body:'{"value":1}'}));
await context.route(/google-analytics\.com|googletagmanager\.com/,r=>r.abort());
const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const run=async()=>{await p.getByRole('button',{name:'내 조건으로 추천 보기',exact:true}).click();await p.waitForTimeout(200);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));};
await p.goto(base+'/plan');await p.getByLabel('지역',{exact:true}).selectOption('서울');
await p.getByLabel('나들이 목적',{exact:true}).selectOption('walk');await p.getByLabel('일정 규모',{exact:true}).selectOption('8');await run();assert(await p.locator('article').count()>0);
await p.getByLabel('주변 식사 후보 포함',{exact:true}).check();await run();assert(await p.locator('article').count()>0);for(const a of await p.locator('article').all())assert(await a.locator('a[href^="/food/spot/"]').count()>0);
await p.getByLabel('주차 조건',{exact:true}).selectOption('required');await run();for(const a of await p.locator('article').all())assert(!(await a.innerText()).includes('자료 없음 · 확인 필요\n이동'));
await p.getByLabel('주변 식사 후보 포함',{exact:true}).uncheck();await p.getByLabel('주차 조건',{exact:true}).selectOption('any');
await p.getByLabel('나들이 목적',{exact:true}).selectOption('event');await run();assert(await p.locator('article').count()>0);assert.equal(await p.locator('article a[href^="/places/"]').count(),0);
await p.getByLabel('이동 편의 조건',{exact:true}).selectOption('wheelchair');await run();assert.equal(await p.locator('article').count(),0);
await p.getByLabel('지역',{exact:true}).selectOption('충북');await p.getByLabel('나들이 목적',{exact:true}).selectOption('all');await p.getByLabel('이동 편의 조건',{exact:true}).selectOption('info');await run();assert(await p.locator('article').count()>0);
await p.getByRole('button',{name:'보관함에 담기',exact:true}).first().click();await p.goto(base+'/saved');await p.getByRole('button',{name:'삭제',exact:true}).waitFor();await p.reload();assert.equal(await p.locator('article').count(),1);
await p.goto(base+'/places/spot/127305');const section=p.getByRole('region',{name:'일정 만들기'});await section.scrollIntoViewIfNeeded();assert((await section.innerText()).includes('1,150m'));assert((await section.innerText()).includes('1,006m'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert(await section.locator('.line-clamp-3').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height<=61)));
if(width===375){await p.waitForTimeout(800);await section.screenshot({path:'C:/Users/tjwjd/AppData/Local/Temp/planner-rich-cards.png'});}
assert.deepEqual(errors,[]);console.log(JSON.stringify({width,pass:true,errors}));await context.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
