import crypto from 'node:crypto';
import {sharedProductRequest} from './github-budget.mjs';
export async function coupangFetch(input,options={}){
 const url=new URL(input);
 const method=options.method||'GET';
 if(url.origin!=='https://api-gateway.coupang.com')throw Error('쿠팡 API 주소 확인 필요');
 const search=method==='GET'&&['/v2/providers/affiliate_open_api/apis/openapi/v1/products/search','/v2/providers/affiliate_open_api/apis/openapi/products/search'].includes(url.pathname)&&options.body===undefined;
 const deeplink=method==='POST'&&url.pathname==='/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink'&&!url.search;
 if(!search&&!deeplink)throw Error('허용되지 않은 쿠팡 API');
 let body;
 if(search){url.searchParams.set('limit','1');}
 else {
  const value=options.body;
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['coupangUrls','subId'].includes(k))||!Array.isArray(value.coupangUrls)||value.coupangUrls.length!==1||typeof value.coupangUrls[0]!=='string')throw Error('단일 상품 링크만 허용');
  const product=new URL(value.coupangUrls[0]);
  if(product.protocol!=='https:'||!['www.coupang.com','m.coupang.com'].includes(product.hostname)||product.port||product.username||product.password||!/^\/vp\/products\/\d+\/?$/.test(product.pathname))throw Error('상품 원본 주소 확인 필요');
  if(value.subId!==undefined&&(typeof value.subId!=='string'||!/^[A-Za-z0-9_-]{1,20}$/.test(value.subId)))throw Error('제휴 채널 확인 필요');
  body=JSON.stringify(value);
 }
 const cacheKey=crypto.createHash('sha256').update(search?url.toString():method+url.toString()+body).digest('hex');
 const access=process.env.COUPANG_ACCESS_KEY,secret=process.env.COUPANG_SECRET_KEY;if(!access||!secret)throw Error('쿠팡 키 미설정');
 return sharedProductRequest(cacheKey,async()=>{
  const access=process.env.COUPANG_ACCESS_KEY,secret=process.env.COUPANG_SECRET_KEY;if(!access||!secret)throw Error('쿠팡 키 미설정');
  const date=new Date().toISOString().slice(2,19).replace(/[-:]/g,'')+'Z';
  const signature=crypto.createHmac('sha256',secret).update(date+method+url.pathname+url.search.slice(1)).digest('hex');
  const result=await fetch(url,{method,headers:{Authorization:`CEA algorithm=HmacSHA256, access-key=${access}, signed-date=${date}, signature=${signature}`,...(body?{'Content-Type':'application/json'}:{})},body,signal:AbortSignal.timeout(15000),redirect:'error'});
  return new Response(await result.arrayBuffer(),{status:result.status,headers:result.headers});
 },{count:1,cacheEnabled:search});
}
