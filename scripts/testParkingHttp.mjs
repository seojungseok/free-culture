import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const keys=[process.env.PARKING_API_KEY,process.env.DATA_GO_KR_KEY].filter(Boolean);
const paths=['/','/saved','/places/spot/2684765','/places/spot/699222','/places/spot/2785265','/event/384927','/course/c/ulsan-nature-day-1uttc9i'];
for(const path of paths){
 const response=await fetch('http://localhost:3210'+path);
 assert.equal(response.status,200,path);
 const html=await response.text();
 assert(keys.every(key=>!html.includes(key)),'No key in HTML');
 assert(!html.includes('Application error'),'No render error');
 if(path.includes('/spot/')||path.includes('/event/')||path.includes('/course/c/')){
  assert(html.includes('한국교통안전공단 주차정보'),'Parking section '+path);
  assert(html.includes('href="https://mwohaji.kr'+path+'"'),'Canonical preserved '+path);
  assert(html.includes('application/ld+json'),'Structured data preserved '+path);
 }
 console.log('PASS 200 / canonical / no key: '+path);
}
for(const id of ['invalid','99999-99999-99999-99-9']){
 const r=await fetch('http://localhost:3210/api/parking/realtime?id='+id);
 assert.equal(r.status,id==='invalid'?400:200);
 if(r.status===200)assert.equal((await r.json()).state,'unavailable');
}
let scanned=0;
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())scan(path);else if(/\.(js|json|html)$/.test(path)){const text=fs.readFileSync(path,'utf8');assert(keys.every(key=>!text.includes(key)),'No key in public build output');scanned++;}}}
scan('.next/static');
assert(keys.every(key=>!fs.readFileSync('data/parking.json','utf8').includes(key)));
console.log('PASS: unknown API IDs, public output secret scan ('+scanned+' files)');
