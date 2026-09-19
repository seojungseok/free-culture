import fs from 'node:fs';
const {products}=JSON.parse(fs.readFileSync('data/autumn-recipes-20260919-assets.json','utf8'));
const result=[];
for(const p of products){
 let url=p.affiliateUrl;const hops=[];let identity=false;
 try{for(let i=0;i<5;i++){
  const u=new URL(url);if(!['link.coupang.com','www.coupang.com','coupa.ng'].includes(u.hostname))throw Error('Unexpected destination');
  if(u.pathname.includes('/vp/products/'))identity=u.pathname.endsWith('/'+p.id);
  const r=await fetch(url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(12000)});
  hops.push({host:u.hostname,status:r.status});
  if(r.status<300||r.status>=400)break;
  url=new URL(r.headers.get('location'),url).href;
 }
 result.push({id:p.id,identity,hops});
 }catch(e){result.push({id:p.id,identity,hops,error:e.cause?.code||e.name});}
 console.log(JSON.stringify(result.at(-1)));
}
fs.writeFileSync('data/autumn-recipes-20260919-links.json',JSON.stringify({checkedAt:new Date().toISOString(),results:result},null,2)+'\n');
