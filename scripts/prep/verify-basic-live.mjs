// Read-only production checks for informational preparation guides.
import fs from 'node:fs';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const base='https://mwohaji.kr',stamp=Date.now(),results=[];
const sitemap=await (await fetch(`${base}/sitemap.xml?check=${stamp}`)).text();
const listing=await (await fetch(`${base}/weekend-prep?check=${stamp}`)).text();
for(const a of store.articles){
 const r=await fetch(`${base}/weekend-prep/${a.slug}?check=${stamp}`),html=await r.text();
 const visible=a.status==='published';
 const checks={slug:a.slug,status:r.status,expectedStatus:visible?200:404,sitemap:sitemap.includes(`/weekend-prep/${a.slug}`)===visible,list:listing.includes(`/weekend-prep/${a.slug}`)===visible};
 if(visible){Object.assign(checks,{title:html.includes(a.title),canonical:html.includes(`href="${base}/weekend-prep/${a.slug}"`),article:html.includes('"@type":"Article"'),breadcrumb:html.includes('"@type":"BreadcrumbList"'),noShopping:!/link\.coupang|coupa\.ng|waug|toss\.im|rel="sponsored|class="prep-tag"/i.test(html)});}
 checks.passed=checks.status===checks.expectedStatus&&Object.entries(checks).filter(([k])=>!['slug','status','expectedStatus'].includes(k)).every(([,v])=>v===true);results.push(checks);
}
console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.passed))process.exitCode=1;
