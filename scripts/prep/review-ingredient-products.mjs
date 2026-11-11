import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {coupangFetch} from './coupang.mjs';

const requests = [
  {key:'crab',keyword:'냉동 절단 꽃게 500g',match:/꽃게/,exclude:/밀키트|꽃게탕|게장|양념|대게|과자|장난감/},
  {key:'green-onion',keyword:'국내산 대파 500g',match:/대파/,exclude:/씨앗|모종|분말|장난감/},
  {key:'broth',keyword:'국물육수 다시팩',match:/다시팩|육수팩/},
  {key:'pot',keyword:'20cm 양수냄비',match:/20\s*(?:cm|센티)/i,also:/냄비/,exclude:/편수|압력|장난감/},
  {key:'ladle',keyword:'스테인리스 국자',match:/국자/,exclude:/장난감/},
  {key:'flour',keyword:'부침가루 1kg',match:/부침가루/},
  {key:'squid',keyword:'손질 냉동 오징어',match:/오징어/,exclude:/건조|마른|진미채|안주|오징어젓/},
  {key:'fishcake',keyword:'모둠 어묵',match:/어묵/,exclude:/밀키트|장난감/},
];

export async function reviewIngredients({fetchProduct=coupangFetch, enabled=false, sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)), now=()=>new Date()}={}) {
  if (!enabled) throw Error('Explicit ingredient review required');
  const candidates=[], skipped=[];
  let apiRequests=0,cacheHits=0;
  for (const query of requests) {
    const endpoint=new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
    endpoint.searchParams.set('keyword',query.keyword);endpoint.searchParams.set('limit','1');
    const response=await fetchProduct(endpoint.href);
    if(response.headers.get('X-Prep-Cache')==='hit')cacheHits++;else apiRequests++;
    if(!response.ok)throw Error(`Ingredient lookup stopped: HTTP ${response.status}`);
    const result=await response.json();
    if(String(result.rCode)!=='0')throw Error('Ingredient lookup response rejected');
    const p=result.data?.productData?.[0], name=String(p?.productName||'');
    let valid=!!p&&query.match.test(name)&&(!query.also||query.also.test(name))&&(!query.exclude||!query.exclude.test(name))&&p.isOutOfStock!==true;
    try {
      const link=new URL(p.productUrl), image=new URL(p.productImage);
      valid=valid&&Number.isSafeInteger(Number(p.productId))&&Number(p.productId)>0&&link.protocol==='https:'&&link.hostname==='link.coupang.com'&&link.pathname==='/re/AFFSDP'&&!link.username&&!link.password&&!link.port&&link.searchParams.get('pageKey')===String(p.productId)&&/^\d+$/.test(link.searchParams.get('itemId')||'')&&/^AF\d+$/.test(link.searchParams.get('lptag')||'')&&image.protocol==='https:'&&(image.hostname==='ads-partners.coupang.com'||image.hostname.endsWith('.coupangcdn.com'));
    } catch {valid=false;}
    if(valid)candidates.push({key:query.key,keyword:query.keyword,productId:p.productId,productName:name,url:p.productUrl,image:p.productImage,checkedAt:now().toISOString(),source:'coupang-api',reviewed:false});
    else skipped.push({key:query.key,reason:'Returned product or option requires a different verified match'});
    // In addition to the shared durable gate, leave time between single-item requests.
    if(query!==requests.at(-1))await sleep(7100);
  }
  return {version:1,candidates,skipped,lookupAttempts:requests.length,apiRequests,cacheHits,productLimitPerRequest:1};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try {
    const result=await reviewIngredients({enabled:process.env.PREP_INGREDIENT_REVIEW==='1'});
    fs.writeFileSync('data/prep-ingredient-candidates-20261111.json',JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({candidates:result.candidates.length,skipped:result.skipped.length,requests:result.apiRequests,reviewed:false}));
  }catch{console.error('Ingredient lookup stopped. Shared authorization, budget, lock, or provider response needs operator review; no automatic recovery or retry.');process.exitCode=1;}
}
