import fs from 'node:fs';
import path from 'node:path';
export const categories=['캠핑 요리','요리 준비물','요리 재료 체크리스트','캠핑요리 가이드','바비큐 요리','캠핑용품','야외 놀이','피크닉 준비','여행 준비'];
export function affiliateUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['link.coupang.com','www.coupang.com','coupa.ng'].includes(u.hostname)&&!u.port;}catch{return false;}}
export function safeImage(value){return typeof value==='string'&&/^\/prep-images\/[a-zA-Z0-9_-]+\.(webp|jpg|png)$/.test(value);}
export function matchesLinkIdentity(p){const u=new URL(p.affiliateUrl);const id=u.searchParams.get('pageKey')||u.pathname.match(/\/vp\/products\/(\d+)/)?.[1];return !id||id===p.id;}
export function validateShape(store){
 if(!store||!Number.isInteger(store.version)||!Array.isArray(store.products)||!Array.isArray(store.articles))throw Error('저장 형식 오류');
 if(store.products.length>2000||store.articles.length>1000)throw Error('저장 한도 초과');
 for(const p of store.products){if(!/^[a-zA-Z0-9_-]+$/.test(p.id)||!p.name||!affiliateUrl(p.affiliateUrl)||typeof p.verified!=='boolean')throw Error('상품명·ID·제휴링크 확인 필요');}
 for(const a of store.articles){if(!/^[a-z0-9-]{3,100}$/.test(a.slug)||!a.title||!a.description||!categories.includes(a.category)||!['draft','scheduled','published'].includes(a.status)||!Array.isArray(a.sections)||!Array.isArray(a.productIds)||!a.cover||!Array.isArray(a.internalLinks))throw Error('글 형식 확인 필요');
 if([a.cover,...a.sections.map(s=>s.image).filter(Boolean)].length>4)throw Error('이미지는 대표 썸네일 포함 글당 최대 4장입니다.');
 if(a.contentStyle!==undefined&&a.contentStyle!=='shoppable-scene-v2')throw Error('지원하지 않는 콘텐츠 형식');
 if(a.salesFormat!==undefined&&!['food-recipe','food-checklist','camping-gear','single-product-play'].includes(a.salesFormat))throw Error('지원하지 않는 판매형 글 형식');
 if(a.checklist!==undefined&&(!Array.isArray(a.checklist)||a.checklist.some(x=>!x.id||!x.label||!x.role||!['main','seasoning','common'].includes(x.group)||!a.productIds.includes(x.productId))||new Set(a.checklist.map(x=>x.id)).size!==a.checklist.length))throw Error('준비물 체크리스트 형식 오류');
 if(a.quietProductIds!==undefined&&(!Array.isArray(a.quietProductIds)||a.quietProductIds.some(id=>!a.productIds.includes(id))))throw Error('설명 생략 상품 연결 오류');
 if(a.shortcutProductId!==undefined&&!a.productIds.includes(a.shortcutProductId))throw Error('간편식 상품 연결 오류');
 for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)]){
  if(im.productMatchReviewed!==undefined&&typeof im.productMatchReviewed!=='boolean')throw Error('상품 장면 검토 형식 오류');
  if(im.referenceProducts!==undefined&&(!Array.isArray(im.referenceProducts)||im.referenceProducts.some(r=>!r||typeof r.productId!=='string'||typeof r.imageUrl!=='string')||new Set(im.referenceProducts.map(r=>r.productId)).size!==im.referenceProducts.length))throw Error('상품 참고 사진 형식 오류');
 }
 for(const s of a.sections)if(typeof s.text!=='string'||typeof s.heading!=='string'||!Array.isArray(s.productIds))throw Error('본문 형식 확인 필요');
 for(const l of a.internalLinks)if(!/^\/(camping|places|kids|course|season)(\/[^?#]*)?$/.test(l.href)||l.href.includes('..'))throw Error('내부 링크 경로 확인 필요');
 for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)]){if(im.url&&!safeImage(im.url))throw Error('이미지는 public/prep-images의 검토된 파일을 사용하세요');if(!Array.isArray(im.tags)||im.tags.some(t=>!a.productIds.includes(t.productId)||!Number.isFinite(t.x)||!Number.isFinite(t.y)||t.x<0||t.x>100||t.y<0||t.y>100))throw Error('상품 태그 위치·연결 오류');}
 }
 if(new Set(store.products.map(p=>p.id)).size!==store.products.length||new Set(store.articles.map(a=>a.slug)).size!==store.articles.length)throw Error('중복 ID 또는 URL');
 return store;
}
function words(a){return new Set(a.sections.map(s=>s.text).join(' ').replace(/[^가-힣a-zA-Z\s]/g,'').split(/\s+/).filter(x=>x.length>1));}
export function publicationErrors(a,store,{exists=p=>fs.existsSync(path.join(process.cwd(),'public',p))}={}){
 const errors=[];if(!a.reviewed)errors.push('본문 편집 검토 필요');
 const photos=[a.cover,...a.sections.map(s=>s.image).filter(Boolean)];if(photos.filter(im=>im.generated).length>4)errors.push('AI 이미지 최대 4장 초과');if(new Set(photos.map(im=>im.url)).size!==photos.length)errors.push('같은 이미지 반복 사용');
 if(photos.filter(im=>im.url).length<3)errors.push('썸네일 포함 이미지 최소 3장 필요');
 if(photos.length>4)errors.push('썸네일 포함 이미지 최대 4장 초과');
 if(a.contentStyle==='shoppable-scene-v2')for(const im of photos){
  const ids=new Set(im.tags.map(t=>t.productId));
  const single=a.salesFormat==='single-product-play';
  if(single?(ids.size!==1||im.tags.length!==1):(ids.size<3||ids.size>4||ids.size!==im.tags.length))errors.push(single?'한 제품 놀이 글은 사진마다 같은 상품 태그 1개 필요':'상품 장면마다 서로 다른 상품 태그 3~4개 필요');
  if(!im.productMatchReviewed)errors.push('합성 장면의 상품 외형·위치 대조 필요');
  for(const id of ids){const p=store.products.find(p=>p.id===id);if(!p||!im.referenceProducts?.some(r=>r.productId===id&&r.imageUrl===p.image))errors.push('태그 상품의 실제 참고 사진 기록 필요');
   const checklistExplains=a.salesFormat==='food-checklist'&&a.checklist?.some(x=>x.productId===id&&x.role.trim().length>=4);
   if(!checklistExplains&&!a.quietProductIds?.includes(id)&&!a.sections.some(s=>s.productIds.includes(id)&&s.text.trim().length>=80))errors.push('사진 속 각 상품의 본문 설명 필요');
  }
 }
 if(a.salesFormat==='single-product-play'&&a.productIds.length!==1)errors.push('한 제품 놀이 글은 상품 1개만 연결');
 if(a.salesFormat==='food-recipe'&&(!a.shortcutProductId||!a.sections.at(-1)?.productIds.includes(a.shortcutProductId)))errors.push('음식 글 마지막 간편식 상품 연결 필요');
 if(a.salesFormat==='food-checklist'&&(!a.checklist||a.checklist.length<8||a.checklist.some(x=>!store.products.some(p=>p.id===x.productId))))errors.push('요리 준비물 체크리스트 상품 연결 필요');
 if(!Number.isFinite(Date.parse(a.publishAt)))errors.push('발행 시각 필요');
 if(a.sections.length<2||a.sections.map(s=>s.text).join('').length<350)errors.push('미완성 본문');
 if(!a.productIds.length)errors.push('등록 상품 연결 필요');
 for(const id of a.productIds){const p=store.products.find(p=>p.id===id);if(!p||!p.verified||!p.source||!Number.isFinite(Date.parse(p.checkedAt))||!p.image||!p.specification||!p.options||!p.evidence||!matchesLinkIdentity(p))errors.push(`상품 일치·출처·규격·옵션 검토 필요: ${id}`);}
 for(const s of a.sections)for(const id of s.productIds)if(!a.productIds.includes(id))errors.push('본문 상품 불일치');
 for(const im of [a.cover,...a.sections.map(s=>s.image).filter(Boolean)])if(!safeImage(im.url)||!exists(im.url)||!im.reviewed||!im.alt||im.width<=0||im.height<=0||(im.generated&&!im.prompt))errors.push('이미지 파일·설명·생성기록·검토 미완료');
 const wa=words(a);for(const other of store.articles.filter(x=>x.slug!==a.slug)){const wb=words(other),overlap=[...wa].filter(w=>wb.has(w)).length;if(a.title===other.title||(wa.size>20&&overlap/Math.min(wa.size,wb.size)>.8))errors.push('다른 글과 제목 또는 내용 중복');}
 return [...new Set(errors)];
}
export async function checkLinks(a,store,fetcher=fetch){const failed=[];for(const id of a.productIds){const p=store.products.find(p=>p.id===id);if(!p||!affiliateUrl(p.affiliateUrl)){failed.push(id);continue;}let target=p.affiliateUrl,ok=false;try{for(let hops=0;hops<6;hops++){if(!affiliateUrl(target))break;const res=await fetcher(target,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(8000)});if(res.status>=200&&res.status<300){ok=true;break;}if(res.status<300||res.status>=400)break;target=new URL(res.headers.get('location')||'',target).href;}}catch{}if(!ok)failed.push(id);}return failed;}
