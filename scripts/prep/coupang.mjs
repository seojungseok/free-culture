import crypto from 'node:crypto';
import {sharedProductRequest} from './github-budget.mjs';
export async function coupangFetch(input,_legacyOptions){
 const url=new URL(input);if(url.origin!=='https://api-gateway.coupang.com'||!url.pathname.endsWith('/products/search'))throw Error('조회량 미확인 API 보류: 기존 캐시 유지');
 url.searchParams.set('limit','1');
 const cacheKey=crypto.createHash('sha256').update(url.toString()).digest('hex');
 const access=process.env.COUPANG_ACCESS_KEY,secret=process.env.COUPANG_SECRET_KEY;if(!access||!secret)throw Error('쿠팡 키 미설정');
 return sharedProductRequest(cacheKey,async()=>{
  const access=process.env.COUPANG_ACCESS_KEY,secret=process.env.COUPANG_SECRET_KEY;if(!access||!secret)throw Error('쿠팡 키 미설정');
  const date=new Date().toISOString().slice(2,19).replace(/[-:]/g,'')+'Z';
  const signature=crypto.createHmac('sha256',secret).update(date+'GET'+url.pathname+url.search.slice(1)).digest('hex');
  const result=await fetch(url,{headers:{Authorization:`CEA algorithm=HmacSHA256, access-key=${access}, signed-date=${date}, signature=${signature}`},signal:AbortSignal.timeout(15000),redirect:'error'});
  return new Response(await result.arrayBuffer(),{status:result.status,headers:result.headers});
 });
}
