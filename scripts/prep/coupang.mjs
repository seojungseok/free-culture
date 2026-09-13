import crypto from 'node:crypto';
import {limitedRequest,stateKey} from './limiter.mjs';
import {redis} from './redis.mjs';
export async function coupangFetch(input,_legacyOptions){
 const url=new URL(input);if(url.origin!=='https://api-gateway.coupang.com'||!url.pathname.endsWith('/products/search'))throw Error('조회량 미확인 API 보류: 기존 캐시 유지');
 url.searchParams.set('limit','1');
 const cacheKey=stateKey()+':cache:'+crypto.createHash('sha256').update(url.toString()).digest('hex');
 const cached=await redis(['GET',cacheKey]);if(cached)return new Response(cached,{headers:{'Content-Type':'application/json','X-Prep-Cache':'hit'}});
 const response=await limitedRequest(async()=>{
  const access=process.env.COUPANG_ACCESS_KEY,secret=process.env.COUPANG_SECRET_KEY;if(!access||!secret)throw Error('쿠팡 키 미설정');
  const date=new Date().toISOString().slice(2,19).replace(/[-:T]/g,'')+'Z';
  const signature=crypto.createHmac('sha256',secret).update(date+'GET'+url.pathname+url.search.slice(1)).digest('hex');
  const result=await fetch(url,{headers:{Authorization:`CEA algorithm=HmacSHA256, access-key=${access}, signed-date=${date}, signature=${signature}`},signal:AbortSignal.timeout(15000),redirect:'error'});
  return new Response(await result.arrayBuffer(),{status:result.status,headers:result.headers});
 });
 if(response.ok){const body=await response.clone().text();await redis(['SET',cacheKey,body,'EX',Math.min(86400,Math.max(1,Number(process.env.COUPANG_CACHE_TTL_SECONDS)||3600))]);}
 if(response.status===429)throw Error('쿠팡 429: 중앙 대기시간 저장, 자동 반복 호출 없음');
 return response;
}
