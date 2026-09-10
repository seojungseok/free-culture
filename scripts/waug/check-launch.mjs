// Read-only live evidence collection. Approval is a separate editorial decision.
import fs from 'node:fs';import crypto from 'node:crypto';import sharp from 'sharp';
import {decodeHtml,validity} from './parse.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const articles=read('data/waug/editorial.json').articles,db=read('data/waug/catalog.json');
const ids=new Set(articles.flatMap(a=>a.productIds)),queue=db.products.filter(p=>ids.has(p.id));
const plain=h=>decodeHtml(h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const result=[];fs.mkdirSync('.cache/waug/originals',{recursive:true});
async function check(p){try{const response=await fetch(p.detailUrl,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`HTTP ${response.status}`);const html=await response.text();const t=plain(html);const start=t.indexOf(p.actualName,t.indexOf(p.actualName)+1);const own=t.slice(start<0?0:start);const head=own.slice(p.actualName.length,p.actualName.length+160);const usage=own.slice(own.indexOf('사용 방법'),own.indexOf('상품 ID:'));const dates=validity(usage);const url=decodeHtml(html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1]||'');const r={id:p.id,placeId:p.placeId,name:p.actualName,url:p.detailUrl,checkedAt:new Date().toISOString(),httpStatus:response.status,head,...dates,sha256:crypto.createHash('sha256').update(html).digest('hex'),image:null};
if(/^https:\/\/d2mgzmtdeipcjp.cloudfront.net\/files\/good\//.test(url)){const ir=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!ir.ok)throw Error(`image ${ir.status}`);const bytes=Buffer.from(await ir.arrayBuffer());const m=await sharp(bytes).metadata();const localPath=`.cache/waug/originals/${p.id}.${m.format==='jpeg'?'jpg':m.format}`;fs.writeFileSync(localPath,bytes);r.image={url,localPath,width:m.width,height:m.height,bytes:bytes.length,mimeType:ir.headers.get('content-type').split(';')[0],sha256:crypto.createHash('sha256').update(bytes).digest('hex')};}
fs.writeFileSync(`.cache/waug/${p.id}-latest.html`,html);result.push(r);console.log(p.id,head.slice(0,55),dates.validUntil,r.image?.width,r.image?.height);
}catch(e){result.push({id:p.id,error:e.message});console.log(p.id,e.message)}}
await Promise.all(Array.from({length:4},async()=>{while(queue.length)await check(queue.shift())}));
fs.writeFileSync('data/waug/launch-live-check.json',JSON.stringify(result,null,2)+'\n');
