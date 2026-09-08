import fs from 'node:fs';
import assert from 'node:assert/strict';
const base='http://localhost:3210';
const regions=['seoul','gyeonggi','incheon','busan','jeju'];
const cities=JSON.parse(fs.readFileSync('data/city-tour-articles.json','utf8')).articles.filter(a=>a.reviewed);
const links=new Set(),images=new Set();
for(const path of [...regions.map(r=>'/region/'+r),...cities.map(a=>'/city-tour/'+a.id)]){
 const start=Date.now(),r=await fetch(base+path),html=await r.text();assert.equal(r.status,200,path);
 assert(html.includes('href="https://mwohaji.kr'+path+'"'),'canonical '+path);
 assert(html.includes('application/ld+json'),'JSON-LD '+path);
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Unique IDs '+path);
 const hrefs=[...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
 for(const href of hrefs){if(href.startsWith('#'))assert(ids.includes(href.slice(1)),'Anchor '+href);}
 // Exercise a bounded card sample plus every category destination in the inspected pages.
 hrefs.filter(h=>h.startsWith('/')&&!h.startsWith('//')).slice(0,35).forEach(h=>links.add(h));
 hrefs.filter(h=>/^\/(?:events\?|places\/[^/]+$|course\/[^/]+$|camping\/region\/|food\/[^/]+$|region\/)/.test(h)).forEach(h=>links.add(h));
 if(path.startsWith('/city-tour/')){
  const src=[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
  assert.equal(new Set(src).size,src.length,'No duplicate image URL '+path);
  src.forEach(s=>images.add(s));console.log(JSON.stringify({path,status:r.status,images:src.length,ms:Date.now()-start}));
 }else console.log(JSON.stringify({path,status:r.status,ms:Date.now()-start}));
}
for(const path of links){const r=await fetch(base+path);assert.equal(r.status,200,'Internal link '+path);await r.body?.cancel();}
console.log('PASS: canonical / JSON-LD / anchors / '+links.size+' internal links; '+images.size+' unique images');
if(process.argv.includes('--images')){
 const sizes=[];
 for(const image of images){const r=await fetch(image,{headers:{Range:'bytes=0-0'},signal:AbortSignal.timeout(12000)});assert(r.ok,'Image HTTP '+r.status);assert(r.headers.get('content-type')?.startsWith('image/'),'Image type');sizes.push(Number(r.headers.get('content-range')?.split('/')[1] || r.headers.get('content-length') || 0));await r.body?.cancel();}
 console.log(JSON.stringify({imageHttpPassed:sizes.length,largestBytes:Math.max(...sizes),totalReportedBytes:sizes.reduce((a,b)=>a+b,0)}));
}
