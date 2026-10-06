import fs from 'node:fs';
import path from 'node:path';
import {withClient} from './client.mjs';
import {selections,channels} from './editorial.mjs';
import {homeDealGroup,eligibleHomeDeal} from './home-deals.mjs';
const output=process.env.TOSS_SHARELINK_PUBLIC_FILE||'data/sharelink-editorial.json';
let previous;try{previous=JSON.parse(fs.readFileSync(output,'utf8'));}catch{}
try {
 await withClient(async({request})=>{
  const publisherId=process.env.TOSS_SHARELINK_PUBLISHER_ID;
  if(!publisherId)throw new Error('Missing private Sharelink publisher');
  const tags=await request('/sub-tags/create',{method:'POST',body:{subTags:channels.map(c=>({subTagId:`mwohaji_${c}`,label:`주말에 뭐하지 ${c}`}))}});
  if(tags.results?.length!==channels.length||tags.results.some(r=>!['CREATED','RESTORED','ALREADY_EXISTS'].includes(r.status)))throw new Error('Sharelink channel registration failed');
  const details={items:[]};
  for(let i=0;i<selections.length;i+=10){const batch=await request(`/products/detail?tacaItemIds=${selections.slice(i,i+10).map(p=>p.id).join(',')}`);details.items.push(...(batch.items||[]));}
  const deals={items:[]};let cursor;
  for(let page=0;page<6;page++){const batch=await request('/products/today-deals?size=10'+(cursor?'&cursor='+encodeURIComponent(cursor):''));deals.items.push(...(batch.items||[]));if(!batch.hasNext||!batch.nextCursor)break;cursor=batch.nextCursor;}
  const products=[];
  for(const choice of selections){
   const p=details.items?.find(p=>p.tacaItemId===choice.id);
   if(!p||p.isSoldOut||!Number.isFinite(p.displayPrice)||p.displayName!==choice.expectedName||!p.mainImageUrls?.includes(choice.imageUrl))continue;
   const links={};
   for(const c of channels.filter(c=>c==='home'||c===choice.topic)){
    const cached=previous?.products?.find(q=>q.id===choice.id&&q.name===p.displayName)?.links?.[c];
    if(cached?.startsWith('https://toss.shopping/')){links[c]=cached;continue;}
    const link=await request('/links',{method:'POST',body:{tacaItemId:choice.id,publisherId,subTagId:`mwohaji_${c}`}});
    if(!link.shortUrl?.startsWith('https://'))throw new Error('Invalid original Sharelink');
    links[c]=link.shortUrl;
   }
   const deal=deals.items?.find(d=>d.tacaItemId===choice.id&&!d.isSoldOut&&Date.parse(d.endAt)>Date.now()&&d.displayPrice===p.displayPrice);
   const {expectedName,imageUrl,...editorial}=choice;
   products.push({...editorial,homeFeature:Boolean(choice.homeFeature)&&choice.topic!=='travel',name:p.displayName,image:imageUrl,price:p.displayPrice,discountRate:p.discountRate,links,...(deal?{endAt:deal.endAt}: {})});
  }
  const homeDeals=(deals.items||[]).filter(p=>homeDealGroup(p.displayName)&&!p.isSoldOut&&Date.parse(p.endAt)>Date.now()).slice(0,30);
  const homeDetails={items:[]};for(let i=0;i<homeDeals.length;i+=10){const batch=await request('/products/detail?tacaItemIds='+homeDeals.slice(i,i+10).map(p=>p.tacaItemId).join(','));homeDetails.items.push(...(batch.items||[]));}
  for(const deal of homeDeals){
   const p=homeDetails.items?.find(p=>p.tacaItemId===deal.tacaItemId);
   if(!eligibleHomeDeal(deal,p))continue;
   const cached=previous?.products?.find(q=>q.id===p.tacaItemId&&q.name===p.displayName)?.links?.home;
   const link=cached?.startsWith('https://toss.shopping/')?{shortUrl:cached}:await request('/links',{method:'POST',body:{tacaItemId:p.tacaItemId,publisherId,subTagId:'mwohaji_home'}});
   if(!link.shortUrl?.startsWith('https://'))throw new Error('Invalid original Sharelink');
   const old=products.findIndex(p=>p.id===deal.tacaItemId);const existingLinks=old>=0?products[old].links:{};if(old>=0)products.splice(old,1);
   products.push({id:p.tacaItemId,topic:homeDealGroup(p.displayName)==='camp'?'camp-food':'daily-food',homeFeature:true,headline:homeDealGroup(p.displayName)==='camp'?'캠핑 먹거리, 오늘의 하루특가':'집에서 가볍게, 오늘의 하루특가',name:p.displayName,option:p.displayName,image:p.mainImageUrls.find(u=>u.includes('/live/temp/'))||p.mainImageUrls.find(u=>u.startsWith('https://')),imageNote:'판매처 제공 상품 사진',price:p.displayPrice,discountRate:p.discountRate,endAt:deal.endAt,reason:'구매 전에 구성과 수량을 확인하세요.',caution:'보관·조리 방법과 배송 조건은 판매처에서 확인하세요.',links:{...existingLinks,home:link.shortUrl}});
  }
  const feed={version:1,checkedAt:new Date().toISOString(),products};
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output+'.tmp',JSON.stringify(feed,null,2),{mode:0o644});fs.renameSync(output+'.tmp',output);
  console.log(`SHARELINK_SYNC_OK products=${products.length} todayDeals=${deals.items?.length||0}`);
 });
}catch(e){console.error(e instanceof Error?e.message:'Sharelink sync failed');process.exitCode=1;}
