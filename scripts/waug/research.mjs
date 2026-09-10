import fs from 'node:fs';
import crypto from 'node:crypto';
import { decodeHtml, validity } from './parse.mjs';

const file = 'data/waug/catalog.json';
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
fs.mkdirSync('.cache/waug', { recursive: true });
fs.mkdirSync('data/waug/research', { recursive: true });
fs.mkdirSync('.cache/waug/research', { recursive: true });
const decode = decodeHtml;
const text = s => decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
const cached=process.argv.includes('--cached');
const queue = db.products.filter(p => !p.duplicateOf && (!p.lastCheckedAt || process.argv.includes('--refresh') || cached));
async function collect(p) {
  const checkedAt = new Date().toISOString();
  try {
    let response;
    if(cached) response={ok:true,status:200,url:p.detailUrl,text:async()=>fs.readFileSync(`.cache/waug/${p.id}.html`,'utf8')};
    else {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { response = await fetch(p.detailUrl || p.affiliateUrl, { signal: AbortSignal.timeout(25000) }); if (response.status < 500) break; } catch (e) { if (attempt === 2) throw e; }
    }
    }
    if (!response?.ok) throw new Error(`HTTP ${response?.status}`);
    const html = await response.text();
    const url = new URL(response.url);
    const productId = url.pathname.match(/\/(?:activities|goods)\/(\d+)/)?.[1];
    if (url.hostname !== 'www.waug.com' || !productId) throw new Error('상품 상세 연결 확인 불가');
    const actualName = text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || html.match(/<title>(.*?)<\/title>/i)?.[1] || '');
    const body = text(html);
    // Exclude recommendations/reviews from the evidence used for this product.
    const start = body.indexOf(actualName, body.indexOf(actualName) + 1);
    const own = body.slice(start >= 0 ? start : 0).split(/(?:경기도|서울|강원도|인천) TOP 20/)[0];
    const usage = own.slice(Math.max(0, own.indexOf('사용 방법')), own.indexOf('상품 ID:') > 0 ? own.indexOf('상품 ID:') : undefined);
    const {validFrom,validUntil}=validity(usage);
    const image = decode(html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] || '');
    const detailUrl = `https://www.waug.com/ko/activities/${productId}`;
    const evidence = { id:p.id, detailUrl, checkedAt, actualName, validUntil, pageSha256:crypto.createHash('sha256').update(html).digest('hex'), httpStatus:response.status, text:own, usage, imageCandidates:image ? [{url:image, provider:'waug', rightsStatus:'pending', matchStatus:'pending'}] : [], verificationStatus:'needs_editor_review' };
    fs.writeFileSync(`.cache/waug/${p.id}.html`, html);
    fs.writeFileSync(`.cache/waug/research/${p.id}.json`, JSON.stringify(evidence,null,2)+'\n');
    const {text:privateText,usage:privateUsage,...publicEvidence}=evidence;
    fs.writeFileSync(`data/waug/research/${p.id}.json`, JSON.stringify(publicEvidence,null,2)+'\n');
    if(p.exclusionReason==='상품 본문 이용기간 종료'){p.eligibility='pending';p.exclusionReason=null;}
    Object.assign(p, { actualName, productId, detailUrl, lastCheckedAt:cached?p.lastCheckedAt:checkedAt, validFrom,validUntil, saleStatus:'pending', verification:{ status:'needs_editor_review', source:`data/waug/research/${p.id}.json`, error:null } });
    // A successful response alone never proves that the product is on sale.
    if (validUntil && validUntil < new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})) { p.saleStatus='expired'; p.eligibility='excluded'; p.exclusionReason='상품 본문 이용기간 종료'; }
    console.log(`${p.id} ${productId} ${actualName}`);
  } catch (e) {
    p.lastCheckedAt=checkedAt; p.saleStatus='pending'; p.verification={status:'failed',error:e.message};
    console.log(`${p.id} 확인 대기: ${e.message}`);
  }
}
await Promise.all(Array.from({length:4}, async()=>{ while(queue.length) await collect(queue.shift()); }));
fs.writeFileSync(file,JSON.stringify(db,null,2)+'\n');
console.log('조사 캐시 저장 완료. 판매·장소·권리 검수 전 자동 발행하지 않음.');
