import fs from 'node:fs';
import crypto from 'node:crypto';

// Scheduled, cached product evidence only. Never called by a visitor request.
const catalog=JSON.parse(fs.readFileSync('data/waug/catalog.json','utf8'));
const published=JSON.parse(fs.readFileSync('data/waug/published.json','utf8'));
const links=new Set(published.articles.flatMap(a=>a.tickets.map(t=>t.href)));
const entries={};
for(const href of links){
  const p=catalog.products.find(p=>p.affiliateUrl===href);
  if(!p||!/^https:\/\/www\.waug\.com\/ko\/activities\/\d+$/.test(p.detailUrl||''))continue;
  try{
    const response=await fetch(p.detailUrl,{redirect:'error',signal:AbortSignal.timeout(12000)});
    if(!response.ok)continue;
    const html=await response.text();
    const id=p.detailUrl.split('/').at(-1);
    // The product's own price panel precedes its own calendar link. Recommendation
    // cards and global text are not evidence for this product.
    const at=html.indexOf('>최저가 보장<');
    if(at<0||!html.slice(at,at+6000).includes(`/ko/activities/${id}/calendar`))continue;
    const now=new Date();
    entries[href]={status:'confirmed',affiliateUrl:href,sourceUrl:p.detailUrl,
      checkedAt:now.toISOString(),reviewedAt:now.toISOString(),expiresAt:new Date(+now+86400000).toISOString(),
      evidenceText:'최저가 보장',conditions:'상품별 와그 최저가보장 조건 적용. 자세한 조건은 연결된 와그 상품 안내 참조.',
      pageSha256:crypto.createHash('sha256').update(html).digest('hex')};
  }catch{ /* Failure removes the badge rather than extending stale evidence. */ }
}
const output={checkedAt:new Date().toISOString(),entries};
fs.writeFileSync('data/waug/booking-guarantees.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({products:links.size,confirmed:Object.keys(entries).length}));
