const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=3257,base=`http://127.0.0.1:${port}`,token=crypto.randomBytes(32).toString('hex');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,WEEKEND_PREP_ADMIN_TOKEN:token,WEEKEND_PREP_LOCAL_REVIEW:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let logs='';for(const s of [child.stdout,child.stderr])s.on('data',d=>{logs=(logs+d).slice(-6000);});
(async()=>{let browser;try{
 for(let i=0;i<90;i++){try{if((await fetch(base+'/weekend-prep')).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));if(i===89)throw Error('서버 시작 실패 '+logs);}
 browser=await chromium.launch({channel:'msedge',headless:true});fs.mkdirSync('.cache/prep-qa',{recursive:true});
 const result=[];
 for(const width of [320,390,1024,1280]){const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.route(/google-analytics|googletagmanager|doubleclick/,r=>r.abort());
 await page.addInitScript(()=>{window.__prepRejections=[];window.addEventListener('unhandledrejection',e=>window.__prepRejections.push({type:e.reason?.type,src:e.reason?.target?.src,message:e.reason?.message}));});
 await page.addInitScript(()=>sessionStorage.setItem('mwohaji:iphone18:popup-dismissed','1'));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 const menu=page.locator('a[href="/weekend-prep"]').filter({hasText:'🧺'});await menu.waitFor();
 assert(await menu.evaluate(e=>e.previousElementSibling?.getAttribute('href')==='/tickets'));
 const menuBox=await menu.boundingBox(),ticketBox=await menu.evaluate(e=>{const r=e.previousElementSibling.getBoundingClientRect();return {x:r.x,y:r.y};});assert(menuBox.x>ticketBox.x);assert(Math.abs(menuBox.y-ticketBox.y)<3);
 if(width<1024){await page.locator('header summary').click();assert(await page.locator('header details a[href="/weekend-prep"]').isVisible());await page.locator('header summary').click();}
 await page.goto(base+'/weekend-prep',{waitUntil:'domcontentloaded'});
 await page.locator('.prep-card').first().waitFor();assert.equal(await page.locator('.prep-card').count(),6);
 assert.equal(await page.getByRole('link',{name:'캠핑 요리',exact:true}).count(),1);
 assert.equal(await page.getByRole('navigation',{name:'페이지',exact:true}).count(),0);
 for(const img of await page.locator('.prep-card img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.evaluate(e=>e.naturalWidth>0));}
 await page.evaluate(()=>scrollTo(0,0));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`.cache/prep-qa/list-${width}.png`,fullPage:true});
 await page.getByLabel('주말 준비 가이드 검색').fill('없는검색어');await page.getByRole('button',{name:'검색',exact:true}).click();await page.getByText('검색 결과가 없어요. 다른 단어로 찾아보세요.').waitFor();
 assert((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
 await page.goto(base+'/weekend-prep/camp-seafood-pot-table');await page.locator('.prep-tag').first().waitFor();
 const tag=page.locator('.prep-tag').first();await tag.focus();await page.keyboard.press('Enter');await page.getByRole('region',{name:'준비물 정보'}).waitFor();
 const panel=page.getByRole('region',{name:'준비물 정보'}),link=panel.getByRole('link');assert((await link.getAttribute('href')).startsWith('https://link.coupang.com/'));assert.equal(await link.getAttribute('rel'),'sponsored noopener');
 await page.keyboard.press('Escape');assert.equal(await panel.count(),0);assert(await tag.evaluate(e=>e===document.activeElement));
 await tag.click();await page.getByRole('button',{name:'닫기 ×'}).click();assert.equal(await panel.count(),0);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('h1').count(),1);
 for(const img of await page.locator('.prep-photo img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.evaluate(e=>e.naturalWidth>0));}
 await page.evaluate(()=>scrollTo(0,0));
 const html=await page.content();assert(html.includes('rel="canonical"'));assert(html.includes('BreadcrumbList'));assert(!html.includes('aggregateRating'));
 await page.screenshot({path:`.cache/prep-qa/article-${width}.png`,fullPage:true});if(errors.length)console.log(await page.evaluate(()=>window.__prepRejections));assert.deepEqual(errors,[]);result.push({width,list:true,search:true,tags:true,keyboard:true,overflow:false,seo:true});await page.close();}
 const denied=await fetch(base+'/api/weekend-prep/admin');assert.equal(denied.status,403);
 const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
 const source=await (await fetch(base+'/api/weekend-prep/admin',{headers})).json();
 const candidate=await (await fetch(base+'/api/weekend-prep/admin',{method:'POST',headers,body:JSON.stringify({action:'lookup',name:source.products[0].name,affiliateUrl:source.products[0].affiliateUrl})})).json();assert(candidate.candidate);assert.equal(candidate.verified,false);
 const saved=await fetch(base+'/api/weekend-prep/admin',{method:'POST',headers,body:JSON.stringify({action:'save',store:source,version:source.version})});assert.equal(saved.status,200);const savedData=await saved.json();assert.equal(savedData.version,source.version+1);
 const stale=await fetch(base+'/api/weekend-prep/admin',{method:'POST',headers,body:JSON.stringify({action:'save',store:source,version:source.version})});assert.equal(stale.status,400);
 const invalid=structuredClone(source);invalid.articles[0].status='published';invalid.articles[0].publishAt=new Date().toISOString();
 const blocked=await fetch(base+'/api/weekend-prep/admin',{method:'POST',headers,body:JSON.stringify({action:'save',store:invalid,version:source.version})});assert.equal(blocked.status,400);
 const admin=await browser.newPage({viewport:{width:390,height:1000}});await admin.goto(base+'/weekend-prep/manage');await admin.getByLabel('관리자 토큰').fill(token);await admin.getByRole('button',{name:'작업 불러오기'}).click();await admin.getByText('불러왔습니다.',{exact:true}).waitFor();
 await admin.locator('select').filter({has:admin.locator('option', {hasText:'상품을 선택하고 사진을 클릭하세요'})}).first().selectOption(source.products[0].id);const before=await admin.locator('.prep-tag').count();await admin.locator('.prep-image').first().click({position:{x:60,y:60}});assert.equal(await admin.locator('.prep-tag').count(),before+1);
 await admin.getByRole('button',{name:'미리보기 열기'}).click();await admin.locator('.prep-article').waitFor();assert(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await admin.screenshot({path:'.cache/prep-qa/admin-390.png',fullPage:true});await admin.close();
 console.log(JSON.stringify({results:result,adminAuth:true,cachedLookup:true,invalidPublicationBlocked:true,apiCalls:0},null,2));
 }finally{if(browser)await browser.close();child.kill();}})().catch(e=>{console.error(e);console.error(logs);process.exitCode=1;});
