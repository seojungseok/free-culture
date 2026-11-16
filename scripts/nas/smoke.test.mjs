import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
test('a 200 response from the old release cannot pass the NAS smoke check',async()=>{
 const commit='a'.repeat(40);let served=commit;
 const server=http.createServer((request,response)=>{
  if(request.url==='/api/site-status'){response.setHeader('content-type','application/json');response.end(JSON.stringify({ready:true,commit:served}));}
  else if(request.url==='/api/visitors'){response.setHeader('x-visitor-store','persistent-v1');response.end(JSON.stringify({total:20,today:2}));}
  else if(request.url==='/rss.xml'){response.setHeader('content-type','application/rss+xml');response.end('<rss version="2.0"><channel><link>/experiences/</link><content:encoded>안내</content:encoded></channel></rss>');}
  else if(request.url==='/places/spot/missing-place-for-test'){response.statusCode=404;response.setHeader('x-robots-tag','noindex');response.end('not found');}
  else response.end('https://mwohaji.kr/event/383591 https://mwohaji.kr/ /event/ https://sokchocul.or.kr/');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const run=()=>new Promise(resolve=>{const child=spawn(process.execPath,['scripts/nas/smoke.mjs'],{env:{...process.env,NAS_SMOKE_BASE:`http://127.0.0.1:${server.address().port}`,EXPECTED_COMMIT:commit},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',b=>output+=b);child.on('close',code=>resolve({code,report:JSON.parse(output)}));});
 try{
  const good=await run();assert.equal(good.code,0);assert.equal(good.report.ok,true);assert.ok(good.report.results.some(result=>result.path==='/api/site-status'&&result.ok));
  served='b'.repeat(40);const stale=await run();assert.equal(stale.code,1);assert.equal(stale.report.ok,false);assert.equal(stale.report.results.find(r=>r.path==='/api/site-status').ok,false);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
