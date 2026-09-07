const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:3027';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for (const width of process.env.TEST_WIDTH ? [Number(process.env.TEST_WIDTH)] : [320,360,375,390,430,1440]) {
   const context=await browser.newContext({viewport:{width:process.env.TEST_RESIZE_FROM?Number(process.env.TEST_RESIZE_FROM):width,height:900},locale:'ko-KR',timezoneId:'Asia/Seoul'});
   if(process.env.TEST_SLOW_HYDRATION) await context.route(/\/_next\/static\/.*\.js/,async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
   if(process.env.TEST_BROWSER_NOW) await context.clock.setFixedTime(new Date(process.env.TEST_BROWSER_NOW));
   await context.route(/abacus\.jasoncameron\.dev/,r=>r.fulfill({contentType:'application/json',body:'{"value":1}'}));
   await context.route(/google-analytics\.com|googletagmanager\.com/,r=>r.abort());
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
   page.on('console',m=>{if(/hydration|hydrated|#418|In HTML|cannot be a descendant/i.test(m.text())) errors.push({url:page.url(),message:m.text()});});
   const check=async(label)=>{await page.waitForTimeout(400);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth?[]:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,80),right:e.getBoundingClientRect().right})));if(overflow.length){console.log(JSON.stringify({width,label,overflow}));process.exitCode=1;}};
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await check('home direct');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.getByRole('navigation',{name:'주말 계획'}).getByRole('link',{name:'맞춤 추천',exact:true}).click();
   if(process.env.TEST_RESIZE_FROM) await page.setViewportSize({width,height:900});
   await page.getByRole('button',{name:'내 조건으로 추천 보기',exact:true}).click();
   try{await page.locator('article').first().waitFor({timeout:10000});}catch(e){console.log(JSON.stringify({step:'recommendation ready',url:page.url(),body:await page.locator('main').innerText(),errors}));throw e;}
   assert(await page.locator('article').count()>0);await check('recommendation');
   await page.locator('article').first().getByRole('link').first().click();
   await page.getByRole('link',{name:'보관함 보기 →',exact:true}).waitFor();
   await page.goBack();
   await page.getByRole('button',{name:'내 조건으로 추천 보기',exact:true}).click();
   await page.getByRole('button',{name:'＋ 보관함에 담기',exact:true}).first().click();
   console.log(JSON.stringify({width,step:'save click',status:await page.getByRole('status').allTextContents(),errors}));
   await page.getByRole('link',{name:'보관함에서 일정 확인 →'}).click();
   await page.waitForURL(base+'/saved');
   await page.reload({waitUntil:'domcontentloaded'});
   try {await page.getByRole('button',{name:'삭제',exact:true}).waitFor({timeout:5000});} catch(e){console.log(JSON.stringify({width,url:page.url(),body:await page.locator('main').innerText(),errors}));throw e;}
   assert.equal(await page.locator('article').count(),1);await check('saved');
   await page.locator('article').first().getByRole('link').first().click();
   await page.getByRole('button',{name:'＋ 보관함에 담기',exact:true}).first().click();
   await page.getByRole('link',{name:'보관함 보기 →',exact:true}).click();
   await page.getByRole('button',{name:'삭제',exact:true}).first().waitFor();
   assert.equal(await page.locator('article').count(),2);
   await page.goBack(); await page.getByRole('link',{name:'보관함 보기 →',exact:true}).waitFor();
   await page.reload({waitUntil:'domcontentloaded'});await check('detail refresh');
   await page.goto(base+'/saved');
   for(let n=0;n<2;n++){await page.getByRole('button',{name:'삭제',exact:true}).first().click();await page.getByRole('button',{name:'삭제 확인',exact:true}).click();}
   await page.reload();await page.getByText('아직 저장한 장소나 일정이 없습니다.').waitFor();
   await page.goto(base+'/weekend');await check('weekend');
   await page.getByRole('group',{name:'요금 필터'}).waitFor();
   for(const index of [1,2,3,4,0]){
    await page.getByRole('group',{name:'요금 필터'}).getByRole('button').nth(index).click();
    await check('price filter '+index);
   }
   console.log(JSON.stringify({width,flow:'recommend-detail-save-refresh-back-delete',errors}));
   if(errors.length) process.exitCode=1;
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
