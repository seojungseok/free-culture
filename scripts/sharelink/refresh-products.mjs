import {selections,channels} from './editorial.mjs';
import {winterSelections} from './winter-editorial.mjs';
import {homeDealGroup,eligibleHomeDeal} from './home-deals.mjs';
import {matchesReviewedProduct} from './reviewed-product.mjs';
import {SharelinkError} from './client.mjs';

const originalLink=url=>typeof url==='string'&&url.startsWith('https://toss.shopping/');

export async function refreshProducts({request,publisherId,previous,onVerified,onIssue}){
 const checkedAt=new Date().toISOString();
 const products=new Map();
 const previousById=new Map((previous?.products||[]).map(p=>[p.id,p]));
 const pending=[];
 const issues=new Set();
 function issue(stage,error){
  issues.add(stage);
  onIssue(stage,error);
 }
 async function details(ids){
  const items=[];
  for(let i=0;i<ids.length;i+=10){
   const batch=await request('/products/detail?tacaItemIds='+ids.slice(i,i+10).join(','));
   if(!Array.isArray(batch?.items))throw new Error('Invalid product detail response');
   items.push(...batch.items);
  }
  return new Map(items.map(p=>[p.tacaItemId,p]));
 }
 async function link(id,channel){
  const result=await request('/links',{method:'POST',body:{tacaItemId:id,publisherId,subTagId:'mwohaji_'+channel}});
  if(!originalLink(result?.shortUrl))throw new Error('Invalid original Sharelink');
  return result.shortUrl;
 }
 const reviewed=await details(selections.map(choice=>choice.id));
 for(const choice of selections){
  const p=reviewed.get(choice.id);
  if(!matchesReviewedProduct(choice,p)||!Number.isFinite(p.displayPrice))continue;
  const prior=previousById.get(choice.id);
  const {expectedName,imageUrl,reviewedHomeLink,...editorial}=choice;
  const links={};
  const product={...editorial,homeFeature:Boolean(choice.homeFeature)&&choice.topic!=='travel',name:p.displayName,image:imageUrl,price:p.displayPrice,discountRate:p.discountRate,links};
  if(prior?.name===p.displayName&&prior.price===p.displayPrice&&Date.parse(prior.endAt)>Date.now())product.endAt=prior.endAt;
  for(const c of channels.filter(c=>c==='home'||c===choice.topic)){
   const saved=prior?.name===p.displayName?prior.links?.[c]:undefined;
   const url=originalLink(saved)?saved:c==='home'?reviewedHomeLink:undefined;
   if(originalLink(url))links[c]=url;
   else pending.push({product,channel:c});
  }
  if(links.home)products.set(product.id,product);
 }
 const snapshot=()=>({checkedAt,products:[...products.values()]});
 // Other provider endpoints can fail even after product details succeed.
 // Restore an expired public feed as soon as its reviewed items are verified.
 if(products.size)onVerified(snapshot());
 let stage='channel registration';
 try{
  const tags=await request('/sub-tags/create',{method:'POST',body:{subTags:channels.map(c=>({subTagId:'mwohaji_'+c,label:'주말에 뭐하지 '+c}))}});
  if(tags.results?.length!==channels.length||tags.results.some(r=>!['CREATED','RESTORED','ALREADY_EXISTS'].includes(r.status)))throw new Error('Sharelink channel registration failed');
  stage='reviewed product link';
  async function issueLink(id,channel){
   try{return await link(id,channel);}
   catch(error){
    // A business rejection for one link must not drop the other products.
    // Transport, authentication and quota failures stop further requests.
    if(!(error instanceof SharelinkError)||error.status!==200||error.code!=='REQUEST_FAILED')throw error;
    issue(stage,error);
    return null;
   }
  }
  for(const {product,channel} of pending){
   const url=await issueLink(product.id,channel);
   if(url)product.links[channel]=url;
   if(product.links.home)products.set(product.id,product);
  }
  stage='daily deal list';
  const deals=[];let cursor;
  for(let page=0;page<10;page++){
   const batch=await request('/products/today-deals?size=10'+(cursor?'&cursor='+encodeURIComponent(cursor):''));
   if(!Array.isArray(batch?.items))throw new Error('Invalid daily deal response');
   deals.push(...batch.items);
   if(!batch.hasNext||!batch.nextCursor)break;
   cursor=batch.nextCursor;
  }
  const liveDeals=deals.filter(d=>!d.isSoldOut&&Date.parse(d.endAt)>Date.now());
  for(const d of liveDeals){
   const p=products.get(d.tacaItemId);
   if(p&&p.name===d.displayName&&p.price===d.displayPrice)p.endAt=d.endAt;
  }
  const homeDeals=liveDeals.filter(d=>homeDealGroup(d.displayName)).slice(0,40);
  stage='daily deal detail';
  const homeDetails=await details(homeDeals.map(d=>d.tacaItemId));
  stage='daily deal link';
  for(const deal of homeDeals){
   const p=homeDetails.get(deal.tacaItemId);
   if(!eligibleHomeDeal(deal,p))continue;
   const winterChoice=winterSelections.find(choice=>choice.id===p.tacaItemId);
   if(winterChoice&&!matchesReviewedProduct(winterChoice,p))continue;
   const existing=products.get(p.tacaItemId),prior=previousById.get(p.tacaItemId);
   const saved=existing?.links.home||(prior?.name===p.displayName&&prior.links?.home);
   const url=originalLink(saved)?saved:await issueLink(p.tacaItemId,'home');
   if(!url)continue;
   const camp=homeDealGroup(p.displayName)==='camp';
   products.set(p.tacaItemId,{id:p.tacaItemId,topic:camp?'camp-food':'daily-food',homeFeature:true,headline:camp?'캠핑 먹거리, 오늘의 하루특가':'집에서 가볍게, 오늘의 하루특가',name:p.displayName,option:p.displayName,image:winterChoice?.imageUrl||p.mainImageUrls.find(u=>u.includes('/live/temp/'))||p.mainImageUrls.find(u=>u.startsWith('https://')),imageNote:'판매처 제공 상품 사진',price:p.displayPrice,...(winterChoice?.priceLabel?{priceLabel:winterChoice.priceLabel}:{}),discountRate:p.discountRate,endAt:deal.endAt,reason:'구매 전에 구성과 수량을 확인하세요.',caution:'보관·조리 방법과 배송 조건은 판매처에서 확인하세요.',links:{...existing?.links,home:url}});
  }
 }catch(error){
  if(!products.size)throw error;
  issue(stage,error);
 }
 return {...snapshot(),partial:issues.size>0};
}
