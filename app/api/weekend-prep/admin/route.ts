import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import fs from 'node:fs';
import {readStore,saveStore} from '@/scripts/prep/store.mjs';
import {validateShape,publicationErrors,checkLinks,affiliateUrl} from '@/scripts/prep/content.mjs';
import {coupangFetch} from '@/scripts/prep/coupang.mjs';
import {generateImage,generateDraft} from '@/scripts/prep/generate.mjs';
import type {PrepStore} from '@/lib/weekend-prep/types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function allowed(r:NextRequest){const host=r.headers.get('host')||'';const expected=process.env.WEEKEND_PREP_ADMIN_TOKEN||'';const actual=r.headers.get('authorization')?.replace(/^Bearer /,'')||'';return process.env.NODE_ENV!=='production'&&/^(localhost|127\.0\.0\.1):\d+$/.test(host)&&(!r.headers.get('origin')||r.headers.get('origin')===`http://${host}`)&&expected.length>=24&&actual.length===expected.length&&timingSafeEqual(Buffer.from(actual),Buffer.from(expected));}
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
export async function GET(r:NextRequest){if(!allowed(r))return reply({error:'로컬 관리자 실행 및 관리자 토큰이 필요합니다.'},403);return reply(readStore());}
export async function POST(r:NextRequest){if(!allowed(r))return reply({error:'관리자 인증 실패'},403);try{
 const raw=await r.text();if(raw.length>2_000_000)return reply({error:'본문이 너무 큽니다.'},413);const body=JSON.parse(raw);
 if(body.action==='image')return reply({image:await generateImage(body)});
 if(body.action==='draft'){
  const current=readStore() as PrepStore;const products=current.products.filter(p=>body.productIds?.includes(p.id));
  const draft=await generateDraft({title:body.title,category:body.category,products,existingTitles:current.articles.map(a=>a.title)});
  if(!Array.isArray(draft.sections)||typeof draft.description!=='string'||draft.sections.some((s:{heading:string;text:string;productIds:string[]})=>typeof s.heading!=='string'||typeof s.text!=='string'||!Array.isArray(s.productIds)||s.productIds.some(id=>!products.some(p=>p.id===id))))throw Error('생성 초안의 상품 연결·본문 형식 검토 필요');
  return reply(draft);
 }
 if(body.action==='lookup'){
  if(typeof body.name!=='string'||!body.name.trim()||!affiliateUrl(body.affiliateUrl))throw Error('상품명과 원본 제휴링크를 입력하세요.');
  // The persisted source cache is a candidate, never automatic identity approval.
  const source=JSON.parse(fs.readFileSync('data/coupangEssentials.json','utf8'));const hit=source.pool.find((p:{name:string;url:string})=>p.name===body.name&&p.url===body.affiliateUrl);
  if(hit)return reply({candidate:{name:hit.name,image:hit.image,id:hit.id,source:'data/coupangEssentials.json',checkedAt:hit.lastSeenAt},verified:false,message:'기존 자료입니다. 사진·규격·옵션과 원본 링크를 대조하세요.'});
  const res=await coupangFetch(`https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(body.name.slice(0,100))}&limit=1`);
  if(!res.ok)throw Error('상품 조회 실패: 수동 등록 가능합니다.');const json=await res.json();const p=json?.data?.productData?.[0];
  return reply({candidate:p?{id:String(p.productId),name:p.productName,image:p.productImage,source:'쿠팡 파트너스 상품 검색 API',checkedAt:new Date().toISOString()}:null,verified:false,message:'검색 후보이며 일치가 보장되지 않습니다. 원본 링크는 유지하고 사진·규격·옵션을 확인하세요.'});
 }
 if(body.action==='save'){
  const next=validateShape(body.store) as PrepStore;const old=readStore() as PrepStore;
  for(const a of next.articles){const prev=old.articles.find(x=>x.slug===a.slug);if(a.status!=='draft'){
   const errors=publicationErrors(a,next);if(errors.length)throw Error(errors.join(' / '));
   const links=await checkLinks(a,next);if(links.length)throw Error('링크 확인 실패: '+links.join(', '));
   if(!prev||JSON.stringify(a)!==JSON.stringify(prev))a.updatedAt=new Date().toISOString();
  }}
  return reply(saveStore(next,body.version));
 }
 throw Error('지원하지 않는 작업');
 }catch(error){return reply({error:error instanceof Error?error.message:'작업 실패'},400);}}
