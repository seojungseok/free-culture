import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {coupangFetch} from './coupang.mjs';

// This switch enables this site's scheduled collector only. Other applications
// using the same account may make requests outside this site's shared gate.
const searches = [
  {keyword:'어묵탕 밀키트', match:/어묵탕|오뎅탕|어묵전골/, art:'fishcake'},
  {keyword:'부대찌개 밀키트', match:/부대찌개/, art:'rice'},
  {keyword:'떡만둣국 밀키트', match:/떡만두|만둣국|만두국/, art:'rice'},
  {keyword:'캠핑 해물탕 밀키트', match:/해물탕/, art:'seafood'},
];

function productFromResponse(product, query, now) {
  if (!product || !query.match.test(product.productName || '')) return null;
  try {
    const link = new URL(product.productUrl);
    const image = new URL(product.productImage);
    if (link.protocol !== 'https:' || link.hostname !== 'link.coupang.com' || image.protocol !== 'https:' || !product.productId) return null;
    const id=String(product.productId), page=link.searchParams.get('pageKey'), item=link.searchParams.get('itemId');
    const partner=link.searchParams.get('lptag');
    if (!/^\d+$/.test(id)||page!==id||!/^\d+$/.test(item||'')||!/^AF\d+$/.test(partner||'')) return null;
    const canonical=new URL(`https://www.coupang.com/vp/products/${id}`);
    canonical.searchParams.set('itemId',item);
    const vendor=link.searchParams.get('vendorItemId');
    if(vendor&&/^\d+$/.test(vendor))canonical.searchParams.set('vendorItemId',vendor);
    return {id,name:String(product.productName),image:image.href,checkedAt:now,art:query.art,canonical:canonical.href,partner};
  } catch { return null; }
}

export async function collectWinterFood({fetchProduct = coupangFetch, clock = () => new Date(), enabled = false, offset = 0} = {}) {
  if (!enabled) throw new Error('공용 제한기 경유 확인 전 조회 중지');
  const result = [], seen = new Set();
  for (const query of searches.slice(offset)) {
    const url = new URL('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search');
    url.searchParams.set('keyword', query.keyword);
    url.searchParams.set('limit', '1');
    const response = await fetchProduct(url.toString());
    if (!response.ok) throw new Error(`상품 조회 실패 (${response.status})`);
    const body = await response.json();
    if (body.rCode && body.rCode !== '0') throw new Error('상품 조회 응답 오류');
    const product = productFromResponse(body.data?.productData?.[0], query, clock().toISOString());
    if (!product || seen.has(product.id)) continue;
    const generated = await fetchProduct('https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink',{
      method:'POST',body:{coupangUrls:[product.canonical],subId:'mwohaji'}
    });
    if (!generated.ok) throw new Error(`상품 링크 발급 실패 (${generated.status})`);
    const issued = await generated.json();
    if (String(issued.rCode)!=='0' || !Array.isArray(issued.data) || issued.data.length!==1) throw new Error('상품 링크 응답 확인 필요');
    const record=issued.data[0];
    let short, original, landing;
    try { short=new URL(record.shortenUrl);original=new URL(record.originalUrl);landing=new URL(record.landingUrl); }
    catch { throw new Error('상품 링크 정보 확인 필요'); }
    const canonical=new URL(product.canonical);
    const sameOption = u => u.searchParams.get('itemId')===canonical.searchParams.get('itemId') && (!canonical.searchParams.has('vendorItemId')||u.searchParams.get('vendorItemId')===canonical.searchParams.get('vendorItemId'));
    const originalMatch=['www.coupang.com','m.coupang.com'].includes(original.hostname)&&original.pathname===canonical.pathname&&sameOption(original);
    const landingMatch=landing.hostname==='link.coupang.com'&&landing.pathname==='/re/AFFSDP'&&landing.searchParams.get('pageKey')===product.id&&sameOption(landing);
    if(short.protocol!=='https:'||short.hostname!=='link.coupang.com'||original.protocol!=='https:'||!originalMatch||landing.protocol!=='https:'||!landingMatch||landing.searchParams.get('lptag')!==product.partner||(landing.searchParams.get('subid')||landing.searchParams.get('subId'))!=='mwohaji') throw new Error('상품·옵션·채널 불일치');
    seen.add(product.id);
    result.push({id:product.id,name:product.name,image:product.image,url:short.href,checkedAt:product.checkedAt,art:product.art});
  }
  if (!result.length) throw new Error('조건에 맞는 상품 없음: 기존 자료 유지');
  return {version:1, checkedAt:clock().toISOString(), products:result};
}

export async function storeProductImages(products,dir,fetcher=fetch) {
  if(!dir)throw Error('상품 이미지 저장 위치 미설정');
  fs.mkdirSync(dir,{recursive:true});
  for(const product of products){
    if(!/^\d+$/.test(product.id))throw Error('상품 이미지 ID 오류');
    let url=new URL(product.image),response;
    for(let n=0;n<4;n++){
      if(url.protocol!=='https:'||!(url.hostname==='ads-partners.coupang.com'||url.hostname.endsWith('.coupangcdn.com')))throw Error('허용되지 않은 상품 이미지 주소');
      response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
      if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');if(!location)throw Error('상품 이미지 경로 오류');url=new URL(location,url);continue;}
      break;
    }
    const type=response?.headers.get('content-type')||'';
    if(!response?.ok||!/^image\/(jpeg|png|webp)/i.test(type))throw Error('상품 이미지 확인 실패');
    const buffer=Buffer.from(await response.arrayBuffer());
    if(buffer.length<100||buffer.length>5*1024*1024)throw Error('상품 이미지 크기 오류');
    const valid=buffer[0]===0xff&&buffer[1]===0xd8||buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
    if(!valid)throw Error('상품 이미지 형식 오류');
    const sharp=(await import('sharp')).default;
    const optimized=await sharp(buffer,{limitInputPixels:40000000}).resize({width:640,withoutEnlargement:true}).webp({quality:82}).toBuffer();
    const destination=path.join(dir,`${product.id}.webp`),temporary=`${destination}.${process.pid}.tmp`;
    try {fs.writeFileSync(temporary,optimized,{mode:0o644});fs.renameSync(temporary,destination);}
    finally {try {fs.unlinkSync(temporary);} catch {}}
  }
}

export function publicFeed(feed){
  return {...feed,products:feed.products.map(product=>({...product,image:`/api/affiliate/coupang-image/${product.id}`,imageSourceHost:new URL(product.image).hostname,imageSourceDigest:createHash('sha256').update(product.image).digest('hex')}))};
}

async function main() {
  const output = process.env.COUPANG_FOOD_PUBLIC_FILE;
  if (!output) throw new Error('상품 출력 파일 미설정');
  if (process.env.COUPANG_SITE_SCHEDULE_ENABLED !== '1') throw new Error('이 사이트의 상품 갱신 비활성');
  const day = date => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  try {
    const previous = JSON.parse(fs.readFileSync(output, 'utf8'));
    const checked = new Date(previous.checkedAt);
    if (process.env.COUPANG_FOOD_FORCE_REFRESH!=='1' && Number.isFinite(checked.getTime()) && day(checked) === day(new Date()) && Array.isArray(previous.products) && previous.products.length) {
      console.log('오늘 갱신된 상품 사용'); return;
    }
  } catch {}
  const feed = await collectWinterFood({enabled:process.env.COUPANG_SITE_SCHEDULE_ENABLED === '1'});
  await storeProductImages(feed.products,process.env.COUPANG_FOOD_IMAGE_DIR);
  fs.mkdirSync(path.dirname(output), {recursive:true});
  const temporary = `${output}.${process.pid}.tmp`;
  try { fs.writeFileSync(temporary, JSON.stringify(publicFeed(feed))+'\n', {mode:0o644}); fs.renameSync(temporary, output); }
  finally { try {fs.unlinkSync(temporary);} catch {} }
  console.log(`겨울 먹거리 상품 ${feed.products.length}개 갱신`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => {console.error('겨울 먹거리 갱신 보류: 기존 자료 유지'); process.exitCode=1;});
}
