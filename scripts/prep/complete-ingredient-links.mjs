import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {coupangFetch} from './coupang.mjs';
import {ingredientQueries} from './ingredient-completion-plan.mjs';

export const candidateFile='data/prep-ingredient-completion-20261111.json';
export function validCandidate(product,query){
 const name=typeof product?.productName==='string'?product.productName:'';
 if(!name||!query.include.every(pattern=>new RegExp(pattern,'i').test(name))||(query.exclude&&new RegExp(query.exclude,'i').test(name))||product.isOutOfStock===true)return false;
 try{
  const link=new URL(product.productUrl),image=new URL(product.productImage),id=Number(product.productId);
  return Number.isSafeInteger(id)&&id>0&&link.protocol==='https:'&&link.hostname==='link.coupang.com'&&link.pathname==='/re/AFFSDP'&&!link.username&&!link.password&&!link.port&&link.searchParams.get('pageKey')===String(id)&&/^\d+$/.test(link.searchParams.get('itemId')||'')&&/^AF\d+$/.test(link.searchParams.get('lptag')||'')&&image.protocol==='https:'&&!image.username&&!image.password&&!image.port&&(image.hostname==='ads-partners.coupang.com'||image.hostname.endsWith('.coupangcdn.com'));
 }catch{return false;}
}

export async function collectIngredients({enabled=false,queries=ingredientQueries,fetchProduct=coupangFetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),save=()=>{},now=()=>new Date(),progress=()=>{}}={}){
 if(!enabled)throw Error('Explicit ingredient collection required');
 const result={version:1,candidates:[],unmatched:[],lookups:[],apiRequests:0,cacheHits:0,productLimitPerRequest:1,reviewed:false};
 let first=true;
 for(const query of queries){
  let found=false;
  for(const keyword of query.keywords){
   if(!first)await sleep(7100);first=false;
   const endpoint=new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
   endpoint.searchParams.set('keyword',keyword);endpoint.searchParams.set('limit','1');
   const response=await fetchProduct(endpoint.href);
   const cached=response.headers.get('X-Prep-Cache')==='hit';result[cached?'cacheHits':'apiRequests']++;
   if(!response.ok)throw Error('Lookup stopped: HTTP '+response.status);
   const body=await response.json();if(String(body.rCode)!=='0')throw Error('Provider response rejected');
   const product=body.data?.productData?.[0],matched=validCandidate(product,query);
   result.lookups.push({key:query.key,keyword,cached,matched,checkedAt:now().toISOString()});
   if(matched){result.candidates.push({key:query.key,labels:query.labels,keyword,productId:Number(product.productId),productName:product.productName,url:product.productUrl,image:product.productImage,source:'coupang-api',checkedAt:now().toISOString(),reviewed:false});found=true;}
   save(result);
   if(found)break;
  }
  if(!found)result.unmatched.push({key:query.key,labels:query.labels,reason:'No matching product returned; needs a different verified query'});
  save(result);progress({completed:result.candidates.length+result.unmatched.length,total:queries.length,candidates:result.candidates.length,unmatched:result.unmatched.length,apiRequests:result.apiRequests,cacheHits:result.cacheHits});
 }
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await collectIngredients({enabled:process.env.PREP_INGREDIENT_COMPLETION==='1',save:result=>fs.writeFileSync(candidateFile,JSON.stringify(result,null,2)+'\n'),progress:value=>console.log(JSON.stringify(value))});}
 catch{console.error('Ingredient collection stopped; shared authorization, lock, budget or provider response needs review. No automatic retry or lock reset.');process.exitCode=1;}
}
