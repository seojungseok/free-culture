import fs from 'node:fs';import crypto from 'node:crypto';import {decodeHtml,validity} from './parse.mjs';
export const plain=s=>decodeHtml(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
export function parseProduct(html,url,checkedAt=new Date().toISOString()){
 const productId=new URL(url).pathname.match(/\/(?:activities|goods)\/(\d+)/)?.[1];if(new URL(url).hostname!=='www.waug.com'||!productId)throw Error('상품 상세 연결 불명확');
 let ld;for(const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){try{const j=JSON.parse(m[1]);if(j['@type']==='Product')ld=j;}catch{}}
 const name=plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||ld?.name||'');if(!name)throw Error('상품명 누락');
 const visible=plain(html);const heading=visible.indexOf(name,visible.indexOf(name)+1);let own=visible.slice(heading>=0?heading:visible.indexOf(name));const end=own.indexOf('상품 ID:');if(end>=0)own=own.slice(0,end+25);const saleEvidence=own.slice(name.length,name.length+180);const usage=own.slice(Math.max(0,own.indexOf('사용 방법')));const dates=validity(usage);const areaServed=ld?.offers?.areaServed;
 const rawAddress=usage.match(/주소\s*[:：]?\s*(.+?)(?:Google|운영\s*시간|이용\s*시간|이용\s*방법|주차|위치|$)/)?.[1]||areaServed?.address?.streetAddress||'';
 const address=(rawAddress.match(/(?:경상북도|경상남도|경기도|강원특별자치도|강원도|부산광역시|대구광역시|울산광역시|인천광역시|서울특별시|경북|경남|경기|부산시|부산|대구|울산|인천|서울|제주)\s+(?=[가-힣]+(?:시|군|구)\s).+/)?.[0]||'').trim();const area=Object.entries({'부산':'부산','대구':'대구','울산':'울산','경상북도':'경북','경북':'경북','경상남도':'경남','경남':'경남','경기도':'경기','경기':'경기','인천':'인천','서울':'서울','강원':'강원','충청':'충청','전라':'전라','제주':'제주'}).find(([k])=>address.startsWith(k))?.[1]||null;
 const saleStatus=/판매 준비 중|커밍순|출시 예정/.test(saleEvidence)?'coming_soon':/판매 종료|판매종료|판매 중지/.test(saleEvidence)?'closed':/사용가능|사용 가능/.test(saleEvidence)?'listed':'pending';
 const images=(Array.isArray(ld?.image)?ld.image:[]).filter(u=>/^https:\/\/d2mgzmtdeipcjp\.cloudfront\.net\/files\/good\//.test(u));
 return {productId,detailUrl:`https://www.waug.com/ko/activities/${productId}`,actualName:name,address,area,saleStatus,saleEvidence,...dates,checkedAt,sha256:crypto.createHash('sha256').update(html).digest('hex'),images,geo:areaServed?.geo||null,usage,own};
}
export async function probeProduct(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('WAUG HTTP '+r.status);const html=await r.text();return {...parseProduct(html,r.url),html};}
