import fs from 'node:fs';
import path from 'node:path';
import {withClient} from './client.mjs';
import {selections,channels} from './editorial.mjs';
const output=process.env.TOSS_SHARELINK_PUBLIC_FILE||'data/sharelink-editorial.json';
try {
 await withClient(async({request})=>{
  const publisherId=process.env.TOSS_SHARELINK_PUBLISHER_ID;
  if(!publisherId)throw new Error('Missing private Sharelink publisher');
  const tags=await request('/sub-tags/create',{method:'POST',body:{subTags:channels.map(c=>({subTagId:`mwohaji_${c}`,label:`주말에 뭐하지 ${c}`}))}});
  if(tags.results?.length!==channels.length||tags.results.some(r=>!['CREATED','RESTORED','ALREADY_EXISTS'].includes(r.status)))throw new Error('Sharelink channel registration failed');
  const details=await request(`/products/detail?tacaItemIds=${selections.map(p=>p.id).join(',')}`);
  const deals=await request('/products/today-deals?size=30');
  const products=[];
  for(const choice of selections){
   const p=details.items?.find(p=>p.tacaItemId===choice.id);
   if(!p||p.isSoldOut||!Number.isFinite(p.displayPrice)||p.displayName!==choice.expectedName||!p.mainImageUrls?.includes(choice.imageUrl))continue;
   const links={};
   for(const c of channels.filter(c=>c==='home'||c===choice.topic)){
    const link=await request('/links',{method:'POST',body:{tacaItemId:choice.id,publisherId,subTagId:`mwohaji_${c}`}});
    if(!link.shortUrl?.startsWith('https://'))throw new Error('Invalid original Sharelink');
    links[c]=link.shortUrl;
   }
   const deal=deals.items?.find(d=>d.tacaItemId===choice.id&&!d.isSoldOut&&Date.parse(d.endAt)>Date.now()&&d.displayPrice===p.displayPrice);
   const {expectedName,imageUrl,...editorial}=choice;
   products.push({...editorial,name:p.displayName,image:imageUrl,price:p.displayPrice,discountRate:p.discountRate,links,...(deal?{endAt:deal.endAt}: {})});
  }
  const feed={version:1,checkedAt:new Date().toISOString(),products};
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output+'.tmp',JSON.stringify(feed,null,2),{mode:0o644});fs.renameSync(output+'.tmp',output);
  console.log(`SHARELINK_SYNC_OK products=${products.length} todayDeals=${deals.items?.length||0}`);
 });
}catch(e){console.error(e instanceof Error?e.message:'Sharelink sync failed');process.exitCode=1;}
